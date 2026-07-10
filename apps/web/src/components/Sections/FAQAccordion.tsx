import { faqs } from "../../data/content";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import type { useSaraloExperience } from "../../hooks/useSaraloExperience";

type FAQAccordionProps = {
  experience: ReturnType<typeof useSaraloExperience>;
};

export function FAQAccordion({ experience }: FAQAccordionProps) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      className={`section-shell faq-section reveal ${isVisible ? "reveal--visible" : ""}`}
      aria-labelledby="faq-title"
      ref={ref}
    >
      <p className="eyebrow">FAQ</p>
      <h2 id="faq-title">Questions builders and users ask first.</h2>

      <div className="faq-list" role="region" aria-label="Frequently asked questions">
        {faqs.map((faq, index) => {
          const isOpen = experience.openFaq === index;
          return (
            <article className={`faq-item ${isOpen ? "faq-item--open" : ""}`} key={faq.question}>
              <button
                aria-expanded={isOpen}
                onClick={() => experience.setOpenFaq(isOpen ? -1 : index)}
                type="button"
              >
                <span>{faq.question}</span>
                <span className="faq-toggle" aria-hidden="true">
                  {isOpen ? "!" : "+"}
                </span>
              </button>
              <div className="faq-answer" role="region">
                <p>{faq.answer}</p>
              </div>
              {isOpen && (
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  className="absolute bottom-3 right-4 text-purple-400/20 pointer-events-none" 
                  fill="currentColor"
                >
                  <path d="M12 2L14.83 9.17L22 12L14.83 14.83L12 22L9.17 14.83L2 12L9.17 9.17L12 2Z" />
                </svg>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
