import React, { useState } from 'react';
import { PageContainer } from '../common/Layout/PageContainer';
import { Heading } from '../common/Typography/Heading';
import { SectionEyebrow } from '../common/Typography/SectionEyebrow';
import { Subtitle } from '../common/Typography/Subtitle';
import { Text } from '../common/Typography/Text';
import { Button } from '../common/Button/Button';
import { FormField, Input, Select } from '../common/Form/FormField';

interface AdmissionCTASectionProps {
  onApplyClick?: () => void;
}

/**
 * DIMABIN Admission CTA Section (Dark Blue Background)
 * Section 9 of the DIMABIN Homepage Reference with optional interactive quick-apply inquiry modal/form.
 */
export const AdmissionCTASection: React.FC<AdmissionCTASectionProps> = ({ onApplyClick }) => {
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <section
      id="admissions"
      className="relative bg-[#122452] text-white py-16 sm:py-24 overflow-hidden border-t-2 border-[#1F3C82]"
      aria-label="Admissions Call to Action"
    >
      {/* Decorative Subtle Gold and Deep Navy Glow Elements */}
      <div
        className="absolute -top-24 -right-24 w-96 h-96 bg-[#F5B800]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#1F3C82]/40 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <PageContainer className="relative z-10 text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          {/* Eyebrow */}
          <SectionEyebrow variant="gold" align="center" className="mb-3 block">
            ENROLLMENT IN PROGRESS
          </SectionEyebrow>

          {/* Main Heading */}
          <Heading level="h2" variant="light" align="center" className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4">
            Answer the Call to Divine Service
          </Heading>

          {/* Gold Italic Subtitle */}
          <p className="font-poppins italic font-semibold text-lg sm:text-xl text-[#F5B800] mb-6">
            Admission is currently open for the academic session
          </p>

          {/* Description */}
          <Text variant="body-lg" color="light" className="text-slate-200 max-w-2xl mx-auto leading-relaxed mb-8">
            Take the bold step towards clarifying your spiritual calling and expanding your
            ministry potential. Our simple online registration process is active and ready to guide you.
          </Text>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setShowInquiryForm(true);
                if (onApplyClick) onApplyClick();
              }}
              className="w-full sm:w-auto font-bold tracking-wider uppercase px-9 py-4 text-sm sm:text-base shadow-lg"
            >
              APPLY FOR ADMISSION
            </Button>

            <a
              href="#contact"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg border-2 border-white/60 hover:border-[#F5B800] text-white hover:text-[#F5B800] text-sm font-bold uppercase tracking-wider transition-all duration-200 font-poppins cursor-pointer"
            >
              INQUIRE AT CAMPUS
            </a>
          </div>

          {/* Interactive Fast Admissions Inquiry Modal / Card */}
          {showInquiryForm && (
            <div className="mt-12 w-full max-w-xl mx-auto bg-white text-[#122452] rounded-2xl p-6 sm:p-8 text-left shadow-2xl border-2 border-[#F5B800] animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-poppins font-bold text-lg text-[#122452]">
                    Quick Admissions Starter
                  </h3>
                  <p className="font-poppins text-xs text-[#5A6A85]">
                    Initiate your 2026 application for DIMABIN programs
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInquiryForm(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Close form"
                >
                  ✕
                </button>
              </div>

              {formSubmitted ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h4 className="font-poppins font-bold text-base text-[#122452]">
                    Application Inquiry Received!
                  </h4>
                  <p className="font-poppins text-xs text-[#5A6A85] max-w-sm mx-auto">
                    Thank you. Our admissions registry will contact you shortly with the complete prospectus and enrollment instructions.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setFormSubmitted(false);
                      setShowInquiryForm(false);
                    }}
                  >
                    Close Window
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField label="Full Name" required>
                    <Input required placeholder="e.g. John Emmanuel Adebayo" />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Email Address" required>
                      <Input type="email" required placeholder="name@example.com" />
                    </FormField>
                    <FormField label="Phone Number" required>
                      <Input type="tel" required placeholder="+234 800 000 0000" />
                    </FormField>
                  </div>

                  <FormField label="Select Desired Program" required>
                    <Select defaultValue="diploma">
                      <option value="diploma">Diploma in Theology (Dipl.Th.)</option>
                      <option value="certificate">Certificate in Christian Ministry</option>
                      <option value="leadership">Christian Leadership Practicum</option>
                      <option value="weekend">Executive Weekend Cohort</option>
                    </Select>
                  </FormField>

                  <div className="pt-2 flex items-center gap-3">
                    <Button variant="secondary" type="submit" fullWidth className="font-bold">
                      SUBMIT APPLICATION INQUIRY
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </PageContainer>
    </section>
  );
};
