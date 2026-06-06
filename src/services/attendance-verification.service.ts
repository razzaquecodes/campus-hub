import { apiClient } from '@/lib/api-client';
import * as FileSystem from 'expo-file-system';
import { AuditRepository } from '../repositories/audit.repository';
import { FaceService } from './face/face.service';
import { Coordinates, LocationService } from './location.service';

export interface FacePipelineResult {
  livenessVerified: boolean;
  faceVerified: boolean;
  matchConfidence: number;
  reason?: string;
}

export interface VerificationResult {
  verified: boolean;
  distance: number;
  reason?: string;
}

export interface BoardPipelineResult {
  boardVerified: boolean;
  score: number;
  extractedText?: string;
  reason?: string;
}

export class AttendanceVerificationService {
  static async verifyLocation(
    studentLocation: Coordinates,
    facultyLocation: Coordinates | null,
    studentId: string,
    sessionId: string,
    allowedRadiusMeters: number = 50 // Configurable radius
  ): Promise<VerificationResult> {
    if (!facultyLocation) {
      await AuditRepository.log({
        action: 'LOCATION_VERIFICATION_FAILED',
        studentId,
        sessionId,
        details: 'Faculty location not found for session'
      });
      return { verified: false, distance: -1, reason: 'Faculty location missing' };
    }

    const distance = LocationService.calculateDistance(studentLocation, facultyLocation);
    const verified = distance <= allowedRadiusMeters;

    await AuditRepository.log({
      action: verified ? 'LOCATION_VERIFICATION_PASSED' : 'LOCATION_VERIFICATION_FAILED',
      studentId,
      sessionId,
      details: `Distance: ${Math.round(distance)}m (Allowed: ${allowedRadiusMeters}m)`
    });

    return {
      verified,
      distance,
      reason: verified ? undefined : `Location is outside the allowed radius of ${allowedRadiusMeters}m`
    };
  }

  static async verifyFaceAndLiveness(
    selfieUri: string,
    referenceImageUri: string | null,
    studentId: string,
    sessionId: string
  ): Promise<FacePipelineResult> {
    // 1. Liveness Detection
    const liveness = await FaceService.checkLiveness(selfieUri);
    
    if (!liveness.isLive) {
      await AuditRepository.log({
        action: 'LIVENESS_CHECK_FAILED',
        studentId,
        sessionId,
        details: `Confidence: ${liveness.confidence}%. Error: ${liveness.error}`
      });
      return { livenessVerified: false, faceVerified: false, matchConfidence: 0, reason: 'Liveness check failed. Please capture a clear, well-lit live selfie.' };
    }

    // 2. Face Matching against MAKAUT / Student Profile Photo
    if (!referenceImageUri) {
       await AuditRepository.log({
        action: 'FACE_VERIFICATION_SKIPPED',
        studentId,
        sessionId,
        details: 'No reference image available for comparison.'
      });
      return { livenessVerified: true, faceVerified: true, matchConfidence: 0, reason: 'Reference image missing. Bypassing identity check.' };
    }

    const match = await FaceService.verifyIdentity(selfieUri, referenceImageUri);

    await AuditRepository.log({
      action: match.verified ? 'FACE_VERIFICATION_PASSED' : 'FACE_VERIFICATION_FAILED',
      studentId,
      sessionId,
      details: `Match Confidence: ${match.confidence}%. Error: ${match.error}`
    });

    return { livenessVerified: true, faceVerified: match.verified, matchConfidence: match.confidence, reason: match.verified ? undefined : 'Face does not match registered profile picture.' };
  }

  static async verifyBoardCapture(
    studentBoardUri: string,
    teacherReferenceData: string, // Changed to act as the teacher's expected text or teacher's image context
    studentId: string,
    sessionId: string,
    minAcceptableScore: number = 80
  ): Promise<BoardPipelineResult> {
    try {
      // Read image as Base64 for secure backend upload and processing
      const base64Image = await FileSystem.readAsStringAsync(studentBoardUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Delegate entire OCR, comparison, and scoring pipeline to the Backend.
      // Backend will securely call Google Cloud Vision (DOCUMENT_TEXT_DETECTION),
      // compare student text with teacher text, and return the similarity score.
      const response = await apiClient.post<{
        verified: boolean;
        score: number;
        extractedText: string;
        reason?: string;
      }>('/api/verification/board', {
        studentImageBase64: base64Image,
        teacherReferenceData,
        sessionId,
        studentId,
        threshold: minAcceptableScore
      });

      await AuditRepository.log({
        action: response.verified ? 'BOARD_VERIFICATION_PASSED' : 'BOARD_VERIFICATION_FAILED',
        studentId,
        sessionId,
        details: `Backend Board Match Score: ${response.score}%`
      });

      return {
        boardVerified: response.verified,
        score: response.score,
        extractedText: response.extractedText,
        reason: response.reason
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown backend verification error';
      await AuditRepository.log({
        action: 'BOARD_VERIFICATION_FAILED',
        studentId,
        sessionId,
        details: `Backend Verification Failed: ${errorMessage}`
      });
      return { boardVerified: false, score: 0, reason: 'Failed to securely verify board capture with the server.' };
    }
  }
}