import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Localisio',
  description: 'Privacy Policy for Localisio platform - how we collect, use, and protect your data',
};

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-600">Last updated: January 28, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none">
          {/* Introduction */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Introduction</h2>
            <p className="text-slate-700 mb-4">
              Localisio ("we", "us", or "our") is committed to protecting your privacy. This Privacy 
              Policy explains how we collect, use, disclose, and safeguard your information when you 
              use our platform and services.
            </p>
            <p className="text-slate-700">
              By using Localisio, you consent to the data practices described in this policy. If you 
              do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-slate-800 mb-3">2.1 Information You Provide</h3>
            <p className="text-slate-700 mb-4">We collect information you voluntarily provide, including:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-6">
              <li><strong>Account Information:</strong> Name, email address, password, profile photo</li>
              <li><strong>Profile Information:</strong> Professional details, services offered, experience, location, languages spoken</li>
              <li><strong>Communication Data:</strong> Messages exchanged with other users, support inquiries</li>
              <li><strong>Payment Information:</strong> When applicable, billing details processed through secure third-party providers</li>
              <li><strong>User Content:</strong> Reviews, ratings, and other content you post</li>
            </ul>

            <h3 className="text-xl font-medium text-slate-800 mb-3">2.2 Information Collected Automatically</h3>
            <p className="text-slate-700 mb-4">When you use our platform, we automatically collect:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-6">
              <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, search queries, time spent on platform</li>
              <li><strong>Location Data:</strong> General location based on IP address (not precise GPS location)</li>
              <li><strong>Cookies and Tracking:</strong> Information collected through cookies and similar technologies</li>
            </ul>

            <h3 className="text-xl font-medium text-slate-800 mb-3">2.3 Information from Third Parties</h3>
            <p className="text-slate-700">
              We may receive information from third-party services if you choose to link your account, 
              such as social media profiles for authentication purposes.
            </p>
          </section>

          {/* How We Use Information */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-700 mb-4">We use the collected information to:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Provide, maintain, and improve our platform and services</li>
              <li>Process and complete transactions</li>
              <li>Create and manage your account</li>
              <li>Connect Seekers with Providers</li>
              <li>Send administrative information, updates, and notifications</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Detect, prevent, and address technical issues and fraudulent activity</li>
              <li>Personalize and improve your experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Sharing Information */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Sharing Your Information</h2>
            <p className="text-slate-700 mb-4">We may share your information in the following circumstances:</p>
            
            <h3 className="text-xl font-medium text-slate-800 mb-3">4.1 With Other Users</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-6">
              <li>Provider profiles are visible to Seekers searching for services</li>
              <li>Reviews and ratings are publicly visible on Provider profiles</li>
              <li>Messages are shared between conversation participants</li>
            </ul>

            <h3 className="text-xl font-medium text-slate-800 mb-3">4.2 With Service Providers</h3>
            <p className="text-slate-700 mb-6">
              We share information with third-party vendors who provide services such as hosting, 
              analytics, payment processing, and customer support. These providers are bound by 
              contractual obligations to protect your information.
            </p>

            <h3 className="text-xl font-medium text-slate-800 mb-3">4.3 For Legal Purposes</h3>
            <p className="text-slate-700 mb-4">We may disclose information when required to:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-6">
              <li>Comply with applicable laws, regulations, or legal processes</li>
              <li>Respond to lawful requests from public authorities</li>
              <li>Protect our rights, privacy, safety, or property</li>
              <li>Enforce our Terms of Service</li>
            </ul>

            <h3 className="text-xl font-medium text-slate-800 mb-3">4.4 Business Transfers</h3>
            <p className="text-slate-700">
              In the event of a merger, acquisition, or sale of assets, your information may be 
              transferred as part of that transaction. We will notify you of any such change.
            </p>
          </section>

          {/* Data Security */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Data Security</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-4">
              <p className="text-blue-800">
                We implement appropriate technical and organizational security measures to protect 
                your personal information against unauthorized access, alteration, disclosure, or 
                destruction.
              </p>
            </div>
            <p className="text-slate-700 mb-4">Our security measures include:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Secure password hashing</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Monitoring for suspicious activity</li>
            </ul>
            <p className="text-slate-700 mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% 
              secure. While we strive to protect your information, we cannot guarantee its absolute security.
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Data Retention</h2>
            <p className="text-slate-700 mb-4">
              We retain your personal information for as long as necessary to:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
              <li>Provide our services and maintain your account</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Support business operations</li>
            </ul>
            <p className="text-slate-700">
              When you delete your account, we will delete or anonymize your personal information 
              within a reasonable timeframe, except where retention is required by law.
            </p>
          </section>

          {/* Your Rights */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Your Rights and Choices</h2>
            <p className="text-slate-700 mb-4">Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-6">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Restriction:</strong> Limit how we use your data</li>
              <li><strong>Objection:</strong> Object to certain processing of your data</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            
            <h3 className="text-xl font-medium text-slate-800 mb-3">7.1 Account Settings</h3>
            <p className="text-slate-700 mb-4">
              You can access, update, or delete much of your information through your account settings. 
              If you need assistance, contact us at the email below.
            </p>

            <h3 className="text-xl font-medium text-slate-800 mb-3">7.2 Communication Preferences</h3>
            <p className="text-slate-700">
              You can opt out of promotional emails by clicking "unsubscribe" in any marketing email. 
              Note that you may still receive transactional or administrative communications.
            </p>
          </section>

          {/* Cookies */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="text-slate-700 mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-6">
              <li>Keep you logged in to your account</li>
              <li>Remember your preferences</li>
              <li>Analyze how our platform is used</li>
              <li>Deliver relevant content</li>
            </ul>

            <h3 className="text-xl font-medium text-slate-800 mb-3">Types of Cookies We Use</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
              <li><strong>Essential Cookies:</strong> Required for basic platform functionality</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our platform</li>
            </ul>
            <p className="text-slate-700">
              You can control cookies through your browser settings. Disabling certain cookies may 
              affect platform functionality.
            </p>
          </section>

          {/* International Transfers */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. International Data Transfers</h2>
            <p className="text-slate-700">
              Your information may be transferred to and processed in countries other than your own. 
              These countries may have different data protection laws. We ensure appropriate safeguards 
              are in place when transferring data internationally, including standard contractual clauses 
              or other approved mechanisms.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Children's Privacy</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <p className="text-amber-800">
                Localisio is not intended for children under 18 years of age. We do not knowingly 
                collect personal information from children under 18. If we become aware that we have 
                collected data from a child under 18, we will take steps to delete such information.
              </p>
            </div>
          </section>

          {/* Third-Party Links */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Third-Party Links</h2>
            <p className="text-slate-700">
              Our platform may contain links to third-party websites or services. We are not 
              responsible for the privacy practices of these third parties. We encourage you to 
              read their privacy policies before providing any information.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-slate-700">
              We may update this Privacy Policy from time to time. We will notify you of any material 
              changes by posting the new Privacy Policy on this page and updating the "Last updated" 
              date. We encourage you to review this policy periodically.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">13. Contact Us</h2>
            <p className="text-slate-700 mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, 
              please contact us:
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <p className="text-blue-800">
                <strong>Email:</strong> privacy@localisio.com<br />
                <strong>Website:</strong> www.localisio.com
              </p>
            </div>
          </section>

          {/* GDPR/CCPA */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">14. Additional Rights for Specific Regions</h2>
            
            <h3 className="text-xl font-medium text-slate-800 mb-3">14.1 European Economic Area (GDPR)</h3>
            <p className="text-slate-700 mb-4">
              If you are in the EEA, you have additional rights under the General Data Protection 
              Regulation (GDPR), including the right to lodge a complaint with your local data 
              protection authority.
            </p>

            <h3 className="text-xl font-medium text-slate-800 mb-3">14.2 California Residents (CCPA)</h3>
            <p className="text-slate-700 mb-4">
              If you are a California resident, you have specific rights under the California Consumer 
              Privacy Act (CCPA), including:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Right to know what personal information we collect and how it is used</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
              <li>Right to non-discrimination for exercising your privacy rights</li>
            </ul>
          </section>

          {/* Acknowledgment */}
          <section className="mt-12 pt-8 border-t border-slate-200">
            <p className="text-slate-600 text-sm">
              By using Localisio, you acknowledge that you have read and understood this Privacy 
              Policy. If you have any questions, please contact us at privacy@localisio.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
