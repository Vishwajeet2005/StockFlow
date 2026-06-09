import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-1 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-ink-500 hover:text-ink-800 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        
        <div className="card p-8 bg-white shadow-sm rounded-2xl animate-fade-in">
          <div className="flex items-center gap-3 mb-6 border-b border-surface-2 pb-6">
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink-900">Privacy Policy</h1>
              <p className="text-ink-500 text-sm">Last updated: June 2026</p>
            </div>
          </div>

          <div className="prose prose-sm sm:prose-base text-ink-700 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-ink-900 mb-2">1. Information We Collect</h2>
              <p>
                When you register a workspace or use StockFlow, we collect information that identifies you and your company. This includes, but is not limited to:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Company name and registration details</li>
                <li>Admin and staff usernames, email addresses, and phone numbers</li>
                <li>Customer and supplier contact information that you input into the system</li>
                <li>Inventory, sales, and manufacturing data generated through your use of our services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900 mb-2">2. How We Use Your Information</h2>
              <p>We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>To provide, operate, and maintain the StockFlow Inventory Management System</li>
                <li>To secure your account via authentication and Two-Factor Authentication (2FA)</li>
                <li>To generate analytics and reports specific to your workspace</li>
                <li>To communicate with you regarding updates, security alerts, and support messages</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900 mb-2">3. Data Security</h2>
              <p>
                We implement a variety of security measures to maintain the safety of your personal information. Your data is stored in secure databases, protected by modern encryption standards, and accessible only by authorized personnel. Passwords are securely hashed using bcrypt.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900 mb-2">4. Sharing Your Information</h2>
              <p>
                We do not sell, trade, or otherwise transfer your Personally Identifiable Information to outside parties. This does not include trusted third parties who assist us in operating our application, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-900 mb-2">5. Your Consent</h2>
              <p>
                By using our site and registering a workspace, you consent to our privacy policy.
              </p>
            </section>
            
            <section>
              <h2 className="text-lg font-semibold text-ink-900 mb-2">6. Changes to our Privacy Policy</h2>
              <p>
                If we decide to change our privacy policy, we will post those changes on this page and update the modification date at the top.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
