import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-ink-500 hover:text-ink-800 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        
        <div className="card p-8 bg-white shadow-sm rounded-2xl animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 border-b border-surface-2 pb-6">
            <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-ink-900">Privacy Policy</h1>
              <p className="text-ink-500 text-sm mt-1">Effective Date: June 09, 2026</p>
            </div>
          </div>

          <div className="prose prose-sm sm:prose-base text-ink-700 max-w-none space-y-8">
            
            <section>
              <h2 className="text-xl font-bold text-ink-900 border-b border-surface-2 pb-2 mb-4">1. Introduction</h2>
              <p>
                Welcome to <strong>StockFlow</strong> ("Company", "we", "our", "us"). We respect your privacy and are committed to protecting it through our compliance with this privacy policy (the "Policy"). This Policy describes the types of information we may collect from you or that you may provide when you access or use our StockFlow Inventory Management System software, application, and related services (collectively, the "Service").
              </p>
              <p>
                Please read this Policy carefully to understand our policies and practices regarding your information and how we will treat it. If you do not agree with our policies and practices, your choice is not to use our Service. By accessing or using this Service, you agree to this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink-900 border-b border-surface-2 pb-2 mb-4">2. Data Collection</h2>
              <p>We collect several different types of information for various purposes to provide and improve our Service to you:</p>
              
              <h3 className="text-lg font-semibold text-ink-800 mt-4 mb-2">Personal Data</h3>
              <p>
                While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Email address</li>
                <li>First name and last name</li>
                <li>Phone number</li>
                <li>Company name and registration details</li>
                <li>Cookies and Usage Data</li>
              </ul>

              <h3 className="text-lg font-semibold text-ink-800 mt-4 mb-2">Customer and Inventory Data</h3>
              <p>
                As an inventory management system, you will actively input data regarding your own customers, suppliers, inventory items, and financial transactions. We process this data strictly on your behalf. You retain all rights and ownership to the data you input into the Service.
              </p>

              <h3 className="text-lg font-semibold text-ink-800 mt-4 mb-2">Usage Data</h3>
              <p>
                We may also collect information that your browser sends whenever you visit our Service or when you access the Service by or through a mobile device ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink-900 border-b border-surface-2 pb-2 mb-4">3. Use of Data</h2>
              <p>StockFlow uses the collected data for various purposes:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>To provide and maintain our Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information so that we can improve our Service</li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent and address technical issues</li>
                <li>To fulfill any other purpose for which you provide it</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink-900 border-b border-surface-2 pb-2 mb-4">4. Retention of Data</h2>
              <p>
                We will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink-900 border-b border-surface-2 pb-2 mb-4">5. Transfer of Data</h2>
              <p>
                Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction.
              </p>
              <p>
                Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer. StockFlow will take all steps reasonably necessary to ensure that your data is treated securely and in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink-900 border-b border-surface-2 pb-2 mb-4">6. Disclosure of Data</h2>
              <p>We may disclose personal information that we collect, or you provide:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Business Transaction:</strong> If we or our subsidiaries are involved in a merger, acquisition or asset sale, your Personal Data may be transferred.</li>
                <li><strong>Disclosure for Law Enforcement:</strong> Under certain circumstances, we may be required to disclose your Personal Data if required to do so by law or in response to valid requests by public authorities.</li>
                <li><strong>Legal Requirements:</strong> To comply with a legal obligation, protect and defend the rights or property of StockFlow, prevent or investigate possible wrongdoing in connection with the Service, or protect the personal safety of users of the Service or the public.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink-900 border-b border-surface-2 pb-2 mb-4">7. Security of Data</h2>
              <p>
                The security of your data is of paramount importance to us. We utilize industry-standard cryptographic techniques, including bcrypt hashing for passwords and secure JSON Web Tokens (JWT) for session management. However, remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink-900 border-b border-surface-2 pb-2 mb-4">8. Your Data Protection Rights Under GDPR and CCPA</h2>
              <p>
                Depending on your location, you may have certain data protection rights under the General Data Protection Regulation (GDPR) or the California Consumer Privacy Act (CCPA). StockFlow aims to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.
              </p>
              <p>If you wish to be informed what Personal Data we hold about you and if you want it to be removed from our systems, please contact us. In certain circumstances, you have the following data protection rights:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>The right to access, update or to delete the information we have on you.</li>
                <li>The right of rectification. You have the right to have your information rectified if that information is inaccurate or incomplete.</li>
                <li>The right to object. You have the right to object to our processing of your Personal Data.</li>
                <li>The right of restriction. You have the right to request that we restrict the processing of your personal information.</li>
                <li>The right to data portability. You have the right to be provided with a copy of your Personal Data in a structured, machine-readable and commonly used format.</li>
                <li>The right to withdraw consent.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink-900 border-b border-surface-2 pb-2 mb-4">9. Service Providers</h2>
              <p>
                We may employ third party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf, to perform Service-related services or to assist us in analyzing how our Service is used. These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink-900 border-b border-surface-2 pb-2 mb-4">10. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top of this Privacy Policy.
              </p>
              <p>
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink-900 border-b border-surface-2 pb-2 mb-4">11. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>By visiting the support section on our website.</li>
                <li>By email: legal@stockflow.example.com</li>
              </ul>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
