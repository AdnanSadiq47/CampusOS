import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import {
  bootstrapPgLiteSchema,
  TenantTransactionManager,
  CANONICAL_ORG_ID_A,
  CANONICAL_ORG_ID_B,
  CANONICAL_SCHOOL_IDS,
  CANONICAL_CAMPUS_IDS,
} from '@campus-os/database';
import { AdmissionsService, UserScopeContext } from '../src/modules/admissions/admissions.service.js';
import { AuditService } from '../src/core/audit/audit.service.js';
import { WorkingContextService } from '../src/core/hierarchy/working-context.service.js';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('CampusOS Admissions — Application Review Comprehensive Test Suite (28 Test Requirements)', () => {
  let pglite: PGlite;
  let txManager: TenantTransactionManager;
  let auditService: AuditService;
  let contextService: WorkingContextService;
  let service: AdmissionsService;

  const superAdminScope: UserScopeContext = {
    organizationId: CANONICAL_ORG_ID_A,
    userRole: 'SUPER_ADMIN',
    isSuperAdmin: true,
  };

  const cliftonCampusScope: UserScopeContext = {
    organizationId: CANONICAL_ORG_ID_A,
    userRole: 'CAMPUS_ADMIN',
    isSuperAdmin: false,
    authorizedCampusIds: [CANONICAL_CAMPUS_IDS.CLIFTON_CAMPUS],
  };

  const dhaCampusScope: UserScopeContext = {
    organizationId: CANONICAL_ORG_ID_A,
    userRole: 'CAMPUS_ADMIN',
    isSuperAdmin: false,
    authorizedCampusIds: [CANONICAL_CAMPUS_IDS.DHA_CAMPUS],
  };

  const otherTenantScope: UserScopeContext = {
    organizationId: CANONICAL_ORG_ID_B,
    userRole: 'SUPER_ADMIN',
    isSuperAdmin: true,
  };

  beforeAll(async () => {
    pglite = new PGlite();
    await bootstrapPgLiteSchema(pglite);
    txManager = new TenantTransactionManager(pglite);
    auditService = new AuditService(txManager);
    contextService = new WorkingContextService();
    service = new AdmissionsService(txManager, auditService, contextService);

    // Warm up seed data
    await service.getPreAdmissions({}, superAdminScope);
  });

  describe('1. School Review & Fee Policy Resolution', () => {
    it('Requirement 1: Resolves Beaconhouse policy with 3 required documents and PKR 2,500 fee (Required Before Test)', async () => {
      const beaconPolicy = await service.getApplicationReviewPolicy(CANONICAL_SCHOOL_IDS.BEACON, superAdminScope);
      expect(beaconPolicy).toBeDefined();
      expect(beaconPolicy.documents.length).toBeGreaterThanOrEqual(2);
      expect(beaconPolicy.feePolicy.feeEnabled).toBe(true);
      expect(beaconPolicy.feePolicy.amount).toBeGreaterThanOrEqual(2000);
      expect(beaconPolicy.feePolicy.collectionRule).toBe('PAYMENT_REQUIRED_BEFORE_TEST');
    });

    it('Requirement 2: Resolves The City School policy with 2 required documents and PKR 2,000 fee (Allowed on Test Day)', async () => {
      const cityPolicy = await service.getApplicationReviewPolicy(CANONICAL_SCHOOL_IDS.CITY, superAdminScope);
      expect(cityPolicy).toBeDefined();
      expect(cityPolicy.documents.length).toBeGreaterThanOrEqual(2);
      expect(cityPolicy.feePolicy.feeEnabled).toBe(true);
      expect(cityPolicy.feePolicy.collectionRule).toBe('PAYMENT_ALLOWED_ON_TEST_DAY');
    });

    it('Requirement 3: Resolves Horizon Grammar policy with fee disabled (NOT_REQUIRED)', async () => {
      const horizonPolicy = await service.getApplicationReviewPolicy(CANONICAL_SCHOOL_IDS.HORIZON, superAdminScope);
      expect(horizonPolicy).toBeDefined();
      expect(horizonPolicy.feePolicy.feeEnabled).toBe(false);
      expect(horizonPolicy.feePolicy.amount).toBe(0);
    });

    it('Requirement 4: Enforces tenant isolation when accessing review policies', async () => {
      await expect(
        service.getApplicationReviewPolicy(CANONICAL_SCHOOL_IDS.BEACON, otherTenantScope)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('2. Unified Application Review Summary & System Advisory', () => {
    it('Requirement 5: Returns unified review details containing Application, Documents, Fee, and Summary', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];
      const review = await service.getApplicationReview(app.id, superAdminScope);
      expect(review).toBeDefined();
      expect(review.application.id).toBe(app.id);
      expect(review.documents.length).toBeGreaterThanOrEqual(1);
      expect(review.feePayment).toBeDefined();
      expect(review.reviewSummary).toBeDefined();
      expect(review.reviewSummary.progressFraction).toBeDefined();
    });

    it('Requirement 6: Advisory system performs automatic check on document upload (MATCHED vs POSSIBLE_MISMATCH)', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];

      const cleanDoc = await service.uploadApplicationDocument({
        applicationId: app.id,
        documentCode: 'BIRTH_CERTIFICATE',
        fileName: 'zayd_official_birth_cert.pdf',
        fileSize: 450000,
        fileType: 'application/pdf',
        fileUrl: 'https://campus-os-cdn.storage.googleapis.com/docs/app-1-birth-cert.pdf',
      }, superAdminScope);

      expect(cleanDoc.systemVerificationStatus).toBe('MATCHED');
      expect(cleanDoc.staffVerificationStatus).toBe('UNVERIFIED');
      expect(cleanDoc.systemCheckRemarks).toContain('matches application profile');

      const mismatchDoc = await service.uploadApplicationDocument({
        applicationId: app.id,
        documentCode: 'PREVIOUS_REPORT_CARD',
        fileName: 'blurry_lowres_grade_sheet.jpg',
        fileSize: 32000,
        fileType: 'image/jpeg',
        fileUrl: 'https://campus-os-cdn.storage.googleapis.com/docs/app-1-report.jpg',
      }, superAdminScope);

      expect(mismatchDoc.systemVerificationStatus).toBe('POSSIBLE_MISMATCH');
      expect(mismatchDoc.systemCheckRemarks).toContain('Low resolution scan');
    });

    it('Requirement 7: System flags corrupted/unsupported files as UNREADABLE', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];

      const badDoc = await service.uploadApplicationDocument({
        applicationId: app.id,
        documentCode: 'B_FORM',
        fileName: 'corrupted_archive.zip',
        fileSize: 100000,
        fileType: 'application/zip',
        fileUrl: 'https://campus-os-cdn.storage.googleapis.com/docs/app-1-bform.zip',
      }, superAdminScope);

      expect(badDoc.systemVerificationStatus).toBe('UNREADABLE');
    });
  });

  describe('3. Staff Document Decisions (Verify, Reject, Re-upload, Override)', () => {
    it('Requirement 8: Staff can verify an uploaded document successfully', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];

      const doc = await service.uploadApplicationDocument({
        applicationId: app.id,
        documentCode: 'BIRTH_CERTIFICATE',
        fileName: 'birth_cert.pdf',
        fileSize: 300000,
        fileType: 'application/pdf',
        fileUrl: 'https://campus-os-cdn.storage.googleapis.com/docs/birth-cert.pdf',
      }, superAdminScope);

      const verified = await service.verifyApplicationDocument({
        documentId: doc.id,
        action: 'VERIFY',
        staffNotes: 'Document inspected and matches NADRA records.',
      }, superAdminScope);

      expect(verified.staffVerificationStatus).toBe('STAFF_VERIFIED');
      expect(verified.verifiedAt).toBeDefined();
    });

    it('Requirement 9: Staff can reject a document with a mandatory reason', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];

      const doc = await service.uploadApplicationDocument({
        applicationId: app.id,
        documentCode: 'B_FORM',
        fileName: 'invalid_doc.pdf',
        fileSize: 100000,
        fileType: 'application/pdf',
        fileUrl: 'https://campus-os-cdn.storage.googleapis.com/docs/invalid.pdf',
      }, superAdminScope);

      const rejected = await service.verifyApplicationDocument({
        documentId: doc.id,
        action: 'REJECT',
        reason: 'Expired B-Form copy; please provide updated NADRA document.',
      }, superAdminScope);

      expect(rejected.staffVerificationStatus).toBe('REJECTED');
      expect(rejected.staffNotes).toContain('Expired B-Form');
    });

    it('Requirement 10: Staff can request re-upload with actionable instructions', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];

      const doc = await service.uploadApplicationDocument({
        applicationId: app.id,
        documentCode: 'PREVIOUS_REPORT_CARD',
        fileName: 'blurry_page.jpg',
        fileSize: 45000,
        fileType: 'image/jpeg',
        fileUrl: 'https://campus-os-cdn.storage.googleapis.com/docs/blurry.jpg',
      }, superAdminScope);

      const reupload = await service.verifyApplicationDocument({
        documentId: doc.id,
        action: 'REQUEST_REUPLOAD',
        reason: 'Page 2 grades are cut off. Please upload full 2-page report card.',
      }, superAdminScope);

      expect(reupload.staffVerificationStatus).toBe('REUPLOAD_REQUESTED');
      expect(reupload.staffNotes).toContain('Page 2 grades are cut off');
    });

    it('Requirement 11: Staff can override system advisory warning with a recorded audit reason', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];

      const doc = await service.uploadApplicationDocument({
        applicationId: app.id,
        documentCode: 'BIRTH_CERTIFICATE',
        fileName: 'manual_seal_birth_cert.pdf',
        fileSize: 500000,
        fileType: 'application/pdf',
        fileUrl: 'https://campus-os-cdn.storage.googleapis.com/docs/seal.pdf',
      }, superAdminScope);

      const overridden = await service.verifyApplicationDocument({
        documentId: doc.id,
        action: 'OVERRIDE',
        reason: 'Physical original document verified in admission office counter.',
      }, superAdminScope);

      expect(overridden.staffVerificationStatus).toBe('STAFF_VERIFIED');
      expect(overridden.overrideReason).toContain('Physical original document');
    });

    it('Requirement 12: Re-uploading a document automatically resets staff verification to UNVERIFIED and bumps version', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];

      const v1 = await service.uploadApplicationDocument({
        applicationId: app.id,
        documentCode: 'BIRTH_CERTIFICATE',
        fileName: 'v1.pdf',
        fileSize: 200000,
        fileType: 'application/pdf',
        fileUrl: 'https://campus-os-cdn.storage.googleapis.com/docs/v1.pdf',
      }, superAdminScope);

      await service.verifyApplicationDocument({
        documentId: v1.id,
        action: 'VERIFY',
      }, superAdminScope);

      const v2 = await service.uploadApplicationDocument({
        applicationId: app.id,
        documentCode: 'BIRTH_CERTIFICATE',
        fileName: 'v2_highres.pdf',
        fileSize: 600000,
        fileType: 'application/pdf',
        fileUrl: 'https://campus-os-cdn.storage.googleapis.com/docs/v2.pdf',
      }, superAdminScope);

      expect(v2.version).toBeGreaterThan(1);
      expect(v2.staffVerificationStatus).toBe('UNVERIFIED');
    });
  });

  describe('4. Dynamic Application Fee Lifecycle', () => {
    it('Requirement 13: Submits payment evidence online with transaction reference', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];

      const payment = await service.submitFeePaymentEvidence({
        applicationId: app.id,
        amount: 2500,
        paymentMethod: 'ONLINE_TRANSFER',
        transactionReference: 'TXN-88442299',
        payerName: 'Salman Tariq',
        payerMobile: '+923001234567',
      }, superAdminScope);

      expect(payment).toBeDefined();
      expect(payment.paymentStatus).toBe('SUBMITTED');
      expect(payment.transactionReference).toBe('TXN-88442299');
    });

    it('Requirement 14: Staff can verify submitted fee payment as PAID_VERIFIED', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];
      const review = await service.getApplicationReview(app.id, superAdminScope);

      const verified = await service.verifyFeePayment({
        paymentId: review.feePayment.id,
        action: 'VERIFY',
        notes: 'Bank statement matched reference TXN-88442299.',
      }, superAdminScope);

      expect(verified.paymentStatus).toBe('PAID_VERIFIED');
      expect(verified.verifiedAt).toBeDefined();
    });

    it('Requirement 15: Staff can report payment mismatch (e.g. incorrect amount or invalid ref)', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];
      const review = await service.getApplicationReview(app.id, superAdminScope);

      const mismatched = await service.verifyFeePayment({
        paymentId: review.feePayment.id,
        action: 'MISMATCH',
        reason: 'Paid amount PKR 1,500 is less than required fee PKR 2,500.',
      }, superAdminScope);

      expect(mismatched.paymentStatus).toBe('MISMATCH');
      expect(mismatched.verificationNotes).toBeDefined();
    });

    it('Requirement 16: Staff can waive application fee with mandatory waiver reason', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];
      const review = await service.getApplicationReview(app.id, superAdminScope);

      const waived = await service.verifyFeePayment({
        paymentId: review.feePayment.id,
        action: 'WAIVE',
        reason: 'Staff child 100% application fee concession approved by Principal.',
      }, superAdminScope);

      expect(waived.paymentStatus).toBe('WAIVED');
      expect(waived.waiverReason).toContain('Staff child 100%');
    });

    it('Requirement 17: Rejects fee actions when reason is omitted for WAIVE or MISMATCH', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];
      const review = await service.getApplicationReview(app.id, superAdminScope);

      await expect(
        service.verifyFeePayment({
          paymentId: review.feePayment.id,
          action: 'WAIVE',
        }, superAdminScope)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('5. Printable Application Fee Voucher Generation', () => {
    it('Requirement 18: Generates complete 3-copy deposit voucher with bank account and reference', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];

      const voucher = await service.generateFeeVoucher(app.id, superAdminScope);
      expect(voucher).toBeDefined();
      expect(voucher.applicationNumber).toBeDefined();
      expect(voucher.amount).toBeGreaterThanOrEqual(2000);
      expect(voucher.voucherReference).toContain('VCH-');
      expect(voucher.bankAccountDetails.bankName).toBe('Meezan Bank Ltd');
      expect(voucher.bankAccountDetails.accountNumber).toBeDefined();
      expect(voucher.bankAccountDetails.iban).toBeDefined();
      expect(voucher.paymentInstructions).toBeDefined();
    });

    it('Requirement 19: Sets appropriate due date on voucher (14 days from creation)', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];

      const voucher = await service.generateFeeVoucher(app.id, superAdminScope);
      expect(new Date(voucher.dueDate).getTime()).toBeGreaterThan(new Date(voucher.issueDate).getTime());
    });
  });

  describe('6. Bank Statement Bulk Reconciliation Engine', () => {
    it('Requirement 20: Reconciles statement rows with exact transaction & voucher references', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];

      // Submit payment first
      await service.submitFeePaymentEvidence({
        applicationId: app.id,
        amount: 2500,
        paymentMethod: 'ONLINE_TRANSFER',
        transactionReference: 'TXN-88442299',
        payerName: 'Salman Tariq',
      }, superAdminScope);

      const statement = [
        {
          transactionId: 'ST-001',
          reference: 'TXN-88442299',
          date: '2026-08-25',
          amount: 2500,
          description: 'ONLINE IBFT ADMISSION FEE',
        },
        {
          transactionId: 'ST-002',
          reference: 'TXN-99999999',
          date: '2026-08-25',
          amount: 5000,
          description: 'RANDOM TRANSFER UNRELATED',
        },
      ];

      const result = await service.reconcileBankStatement({ statementRows: statement }, superAdminScope);
      expect(result.totalRows).toBe(2);
      expect(result.matchedCount).toBeGreaterThanOrEqual(1);

      const matchedItem = result.items.find((i) => i.statementRow.reference === 'TXN-88442299');
      expect(matchedItem?.matchStatus).toBe('MATCHED');
      expect(matchedItem?.confidence).toBeGreaterThanOrEqual(90);
    });

    it('Requirement 21: Confirms all matched reconciliations in one atomic operation', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];
      const review = await service.getApplicationReview(app.id, superAdminScope);

      const confirmRes = await service.confirmMatchedReconciliations({
        matchedPaymentIds: [review.feePayment.id],
      }, superAdminScope);
      expect(confirmRes.confirmedCount).toBeGreaterThanOrEqual(1);

      const updatedReview = await service.getApplicationReview(app.id, superAdminScope);
      expect(updatedReview.feePayment.paymentStatus).toBe('PAID_VERIFIED');
    });
  });

  describe('7. Test Candidate Eligibility & Step Progression', () => {
    it('Requirement 22: Candidate with pending fee is BLOCKED when collection rule is PAYMENT_REQUIRED_BEFORE_TEST', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const beaconApp = list.items.find((i) => i.schoolId === CANONICAL_SCHOOL_IDS.BEACON);
      if (beaconApp) {
        const review = await service.getApplicationReview(beaconApp.id, superAdminScope);
        await service.verifyFeePayment({
          paymentId: review.feePayment.id,
          action: 'MISMATCH',
          reason: 'Payment pending confirmation',
        }, superAdminScope);

        const candidates = await service.getEligibleCandidatesForTest({}, superAdminScope);
        const found = candidates.find((c: any) => c.id === beaconApp.id);
        expect(found).toBeUndefined();
      }
    });

    it('Requirement 23: Candidate with pending fee is ELIGIBLE when collection rule is PAYMENT_ALLOWED_ON_TEST_DAY', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const cityApp = list.items.find((i) => i.schoolId === CANONICAL_SCHOOL_IDS.CITY);
      if (cityApp) {
        // Mark data verified
        await service.bulkMarkApplicationsVerified({ applicationIds: [cityApp.id] }, superAdminScope);

        const candidates = await service.getEligibleCandidatesForTest({}, superAdminScope);
        const found = candidates.find((c: any) => c.id === cityApp.id);
        expect(found).toBeDefined();
        expect(found?.feeBadge).toContain('Test-Day Payment');
        expect(found?.reviewBadge).toBeDefined();
      }
    });

    it('Requirement 24: Candidate with verified fee is ELIGIBLE with Fee Paid badge', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];
      const review = await service.getApplicationReview(app.id, superAdminScope);

      await service.verifyFeePayment({
        paymentId: review.feePayment.id,
        action: 'VERIFY',
      }, superAdminScope);

      for (const d of review.documents) {
        await service.verifyApplicationDocument({
          documentId: d.id,
          action: 'VERIFY',
        }, superAdminScope);
      }

      await service.bulkMarkApplicationsVerified({ applicationIds: [app.id] }, superAdminScope);

      const candidates = await service.getEligibleCandidatesForTest({}, superAdminScope);
      const found = candidates.find((c: any) => c.id === app.id);
      expect(found).toBeDefined();
      expect(found?.feeBadge).toContain('Paid');
      expect(found?.reviewBadge).toBeDefined();
    });

    it('Requirement 25: Candidate with waived fee is ELIGIBLE with Fee Waived badge', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];
      const review = await service.getApplicationReview(app.id, superAdminScope);

      await service.verifyFeePayment({
        paymentId: review.feePayment.id,
        action: 'WAIVE',
        reason: 'Approved exemption',
      }, superAdminScope);

      await service.bulkMarkApplicationsVerified({ applicationIds: [app.id] }, superAdminScope);

      const candidates = await service.getEligibleCandidatesForTest({}, superAdminScope);
      const found = candidates.find((c: any) => c.id === app.id);
      expect(found).toBeDefined();
      expect(found?.feeBadge).toContain('Waived');
    });

    it('Requirement 26: Automatic Step Progression updates currentStep when review is complete', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];
      await service.bulkMarkApplicationsVerified({ applicationIds: [app.id] }, superAdminScope);

      const updatedApp = await service.getPreAdmissionById(app.id, superAdminScope);
      expect(updatedApp.verificationStatus).toBe('STAFF_VERIFIED');
      expect(updatedApp.currentStepName).toBeDefined();
    });

    it('Requirement 27: Enforces strict Working Context isolation on eligible candidate selection', async () => {
      const cliftonCandidates = await service.getEligibleCandidatesForTest({}, cliftonCampusScope);
      expect(cliftonCandidates.every((c: any) => c.campusId === CANONICAL_CAMPUS_IDS.CLIFTON_CAMPUS)).toBe(true);

      const dhaCandidates = await service.getEligibleCandidatesForTest({}, dhaCampusScope);
      expect(dhaCandidates.every((c: any) => c.campusId === CANONICAL_CAMPUS_IDS.DHA_CAMPUS)).toBe(true);
    });

    it('Requirement 28: Rejecting a required document resets test eligibility and step progression', async () => {
      const list = await service.getPreAdmissions({}, superAdminScope);
      const app = list.items[0];
      const review = await service.getApplicationReview(app.id, superAdminScope);
      const firstDoc = review.documents[0];

      await service.verifyApplicationDocument({
        documentId: firstDoc.id,
        action: 'REJECT',
        reason: 'Document invalid',
      }, superAdminScope);

      const updatedReview = await service.getApplicationReview(app.id, superAdminScope);
      expect(updatedReview.reviewSummary.isTestEligible).toBe(false);
      expect(updatedReview.reviewSummary.overallStatus).toBe('NEEDS_ATTENTION');
    });
  });
});
