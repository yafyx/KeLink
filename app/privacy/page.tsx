import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | KeLink",
  description: "Privacy Policy for KeLink application",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-sm text-gray-500 mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p>
            KeLink ("we", "our", or "us") is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our service.
          </p>
          <p>
            We comply with the General Data Protection Regulation (GDPR) and the
            California Consumer Privacy Act (CCPA) to ensure your data is
            handled responsibly.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            Information We Collect
          </h2>

          <h3 className="text-xl font-medium mt-4 mb-2">
            Personal Information
          </h3>
          <p>We may collect the following personal information:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Contact information (name, email address, phone number)</li>
            <li>Account credentials</li>
            <li>Device information</li>
            <li>User-generated content</li>
          </ul>

          <h3 className="text-xl font-medium mt-4 mb-2">Location Data</h3>
          <p>
            Our service relies on location data to function properly. We
            collect:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Precise geolocation data when using the Find feature</li>
            <li>Peddler location data for registered peddlers</li>
          </ul>
          <p>
            You can disable location services through your device settings, but
            this may limit functionality.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            How We Use Your Information
          </h2>
          <p>We use your information for the following purposes:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions</li>
            <li>Send service-related communications</li>
            <li>Respond to inquiries and offer support</li>
            <li>Connect users with nearby peddlers</li>
            <li>Monitor and analyze usage patterns</li>
            <li>Enforce our terms, conditions, and policies</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
          <p>
            We retain location data for no more than 90 days. Other personal
            information is retained as long as your account is active or as
            needed to provide services.
          </p>
          <p>
            You can request deletion of your data at any time through our
            account settings or by contacting us.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            Data Sharing and Disclosure
          </h2>
          <p>We may share your information with:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Service providers who perform services on our behalf</li>
            <li>
              Peddlers, when you use our Find feature (limited to necessary
              information)
            </li>
            <li>Legal authorities when required by law</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access the personal information we have about you</li>
            <li>Correct inaccuracies in your personal information</li>
            <li>Delete your personal information</li>
            <li>
              Object to or restrict the processing of your personal information
            </li>
            <li>Request portability of your personal information</li>
            <li>Withdraw consent at any time (where applicable)</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information
            below.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Cookie Policy</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your
            experience on our site. You can set your browser to refuse all or
            some browser cookies, but this may limit functionality.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
          <p>
            Our service is not directed to individuals under 16. We do not
            knowingly collect personal information from children under 16.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            Changes to This Privacy Policy
          </h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us
            at:
          </p>
          <p className="mt-2">Email: privacy@kelink.com</p>
        </section>
      </div>

      <div className="mt-8">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
