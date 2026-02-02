import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Localisio',
  description: 'Terms of Service and legal disclaimer for Localisio platform',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-slate-600">Last updated: January 28, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none">
          {/* Introduction */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Introduction</h2>
            <p className="text-slate-700 mb-4">
              Welcome to Localisio ("Platform", "we", "us", or "our"). Localisio is an online platform 
              that connects users seeking services ("Seekers" or "Clients") with independent service 
              providers ("Providers" or "Experts"). By accessing or using our Platform, you agree to 
              be bound by these Terms of Service ("Terms").
            </p>
            <p className="text-slate-700">
              Please read these Terms carefully before using our services. If you do not agree with 
              any part of these Terms, you may not use our Platform.
            </p>
          </section>

          {/* Platform Role */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Platform Role and Disclaimer</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-amber-800 mb-3">⚠️ Important Disclaimer</h3>
              <p className="text-amber-700 mb-3">
                <strong>Localisio is solely a marketplace platform</strong> that facilitates connections 
                between Seekers and Providers. We do not employ, endorse, recommend, or guarantee any 
                Provider listed on our Platform.
              </p>
              <ul className="list-disc list-inside text-amber-700 space-y-2">
                <li>We are not a party to any agreement between Seekers and Providers</li>
                <li>We do not control the quality, safety, legality, or availability of services offered</li>
                <li>We do not verify the accuracy of Provider qualifications, credentials, or claims</li>
                <li>We are not responsible for any interactions, agreements, or disputes between users</li>
              </ul>
            </div>
            <p className="text-slate-700">
              All services are provided directly by independent Providers, not by Localisio. Any 
              contract for services is strictly between the Seeker and the Provider. Localisio 
              assumes no liability for services rendered or any outcomes resulting from such services.
            </p>
          </section>

          {/* User Responsibilities */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. User Responsibilities</h2>
            
            <h3 className="text-xl font-medium text-slate-800 mb-3">3.1 For All Users</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-6">
              <li>You must be at least 18 years old to use this Platform</li>
              <li>You are responsible for maintaining the confidentiality of your account</li>
              <li>You agree to provide accurate and complete information</li>
              <li>You will not use the Platform for any illegal or unauthorized purpose</li>
              <li>You will not harass, abuse, or harm other users</li>
            </ul>

            <h3 className="text-xl font-medium text-slate-800 mb-3">3.2 For Seekers</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-6">
              <li>You are responsible for evaluating Providers before engaging their services</li>
              <li>You should verify any credentials, licenses, or qualifications independently</li>
              <li>You acknowledge that reviews and ratings reflect individual experiences and may not be representative</li>
              <li>You agree to communicate respectfully and honestly with Providers</li>
            </ul>

            <h3 className="text-xl font-medium text-slate-800 mb-3">3.3 For Providers</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>You represent that you have the legal right to offer your services</li>
              <li>You are responsible for obtaining any necessary licenses, permits, or certifications</li>
              <li>You agree to accurately represent your qualifications and experience</li>
              <li>You are solely responsible for the services you provide and their outcomes</li>
              <li>You will comply with all applicable laws and regulations in your jurisdiction</li>
              <li>You understand that Localisio may review and approve profiles before publication</li>
            </ul>
          </section>

          {/* No Professional Advice */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. No Professional Advice</h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-4">
              <p className="text-red-700">
                <strong>Localisio does not provide professional, legal, financial, medical, or any 
                other type of advice.</strong> Information provided through our Platform, including 
                Provider profiles and user communications, is for informational purposes only and 
                should not be construed as professional advice.
              </p>
            </div>
            <p className="text-slate-700">
              Always consult with qualified professionals for advice specific to your situation. 
              Any reliance on information obtained through this Platform is at your own risk.
            </p>
          </section>

          {/* Verification and Trust */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Verification and Trust Badges</h2>
            <p className="text-slate-700 mb-4">
              Localisio may display verification badges or trust indicators on Provider profiles. 
              These indicators may signify:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
              <li><strong>Profile Approval:</strong> The profile has been reviewed by our team for completeness</li>
              <li><strong>Verification Badge:</strong> The Provider has completed additional identity verification steps</li>
            </ul>
            <p className="text-slate-700">
              <strong>However, these badges do not constitute:</strong> endorsement of the Provider's 
              skills, verification of professional qualifications, background checks, or guarantees 
              of service quality. Users should always conduct their own due diligence.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Limitation of Liability</h2>
            <div className="bg-slate-100 rounded-xl p-6 mb-4">
              <p className="text-slate-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LOCALISIO AND ITS AFFILIATES, 
                OFFICERS, EMPLOYEES, AGENTS, PARTNERS, AND LICENSORS SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
                <li>Damages resulting from services provided by Providers</li>
                <li>Damages resulting from unauthorized access to your account</li>
                <li>Any conduct or content of any third party on the Platform</li>
                <li>Any errors, mistakes, or inaccuracies in content</li>
              </ul>
            </div>
            <p className="text-slate-700">
              In no event shall our total liability exceed the amount you paid to Localisio, if any, 
              in the twelve (12) months preceding the claim.
            </p>
          </section>

          {/* Indemnification */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Indemnification</h2>
            <p className="text-slate-700">
              You agree to indemnify, defend, and hold harmless Localisio and its affiliates, 
              officers, directors, employees, and agents from and against any claims, liabilities, 
              damages, losses, costs, or expenses (including reasonable attorneys' fees) arising 
              out of or relating to:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mt-4">
              <li>Your use of the Platform</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Services you provide or receive through the Platform</li>
              <li>Any content you post or submit</li>
            </ul>
          </section>

          {/* Dispute Resolution */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Dispute Resolution</h2>
            <p className="text-slate-700 mb-4">
              Any disputes between Seekers and Providers should be resolved directly between the 
              parties involved. Localisio is not obligated to mediate or resolve any disputes, 
              though we may choose to assist at our sole discretion.
            </p>
            <p className="text-slate-700">
              For disputes with Localisio, you agree to first attempt to resolve the dispute 
              informally by contacting us. If we cannot resolve the dispute within 30 days, 
              either party may pursue formal dispute resolution.
            </p>
          </section>

          {/* Reviews and Content */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Reviews and User Content</h2>
            <p className="text-slate-700 mb-4">
              Users may post reviews, ratings, and other content on the Platform. By posting 
              content, you:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
              <li>Grant Localisio a non-exclusive, worldwide, royalty-free license to use, display, and distribute such content</li>
              <li>Represent that you have the right to post such content</li>
              <li>Agree that your content will not violate any third party rights</li>
              <li>Acknowledge that we may remove or modify content at our discretion</li>
            </ul>
            <p className="text-slate-700">
              Reviews reflect the personal opinions of users and are not verified or endorsed by 
              Localisio. We do not guarantee the accuracy, completeness, or usefulness of any review.
            </p>
          </section>

          {/* Termination */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Termination</h2>
            <p className="text-slate-700 mb-4">
              We may terminate or suspend your account and access to the Platform at any time, 
              without prior notice or liability, for any reason, including:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
              <li>Violation of these Terms</li>
              <li>Fraudulent, abusive, or illegal activity</li>
              <li>Conduct harmful to other users or the Platform</li>
              <li>At our sole discretion for any other reason</li>
            </ul>
            <p className="text-slate-700">
              Upon termination, your right to use the Platform will immediately cease.
            </p>
          </section>

          {/* Privacy */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Privacy</h2>
            <p className="text-slate-700">
              Your privacy is important to us. Our collection and use of personal information is 
              governed by our Privacy Policy, which is incorporated into these Terms by reference. 
              By using the Platform, you consent to our collection and use of information as 
              described in our Privacy Policy.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Changes to Terms</h2>
            <p className="text-slate-700">
              We reserve the right to modify these Terms at any time. We will notify users of 
              any material changes by posting the new Terms on the Platform and updating the 
              "Last updated" date. Your continued use of the Platform after such changes 
              constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Governing Law */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">13. Governing Law</h2>
            <p className="text-slate-700">
              These Terms shall be governed by and construed in accordance with applicable laws, 
              without regard to conflict of law principles. Any legal action or proceeding arising 
              under these Terms shall be brought exclusively in the appropriate courts.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">14. Contact Us</h2>
            <p className="text-slate-700 mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <p className="text-blue-800">
                <strong>Email:</strong> support@localisio.com<br />
                <strong>Website:</strong> www.localisio.com
              </p>
            </div>
          </section>

          {/* Acknowledgment */}
          <section className="mt-12 pt-8 border-t border-slate-200">
            <p className="text-slate-600 text-sm">
              By using Localisio, you acknowledge that you have read, understood, and agree to be 
              bound by these Terms of Service. If you are using the Platform on behalf of an 
              organization, you represent and warrant that you have the authority to bind that 
              organization to these Terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
