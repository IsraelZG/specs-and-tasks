import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function AccordionSection() {
  return (
    <SectionWrapper
      id="accordion"
      title="Accordion"
      overline="Component"
      description="A stacked list of disclosures that can expand or collapse contents."
    >
      <Subsection title="Frequently Asked Questions" stack>
        <div className="w-full max-w-xl">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is it customizable?</AccordionTrigger>
              <AccordionContent>
                Yes! It responds immediately to CSS variables compiled by the Antigravity theme engine.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>
                Yes! It uses Radix Accordion primitives which handle WAI-ARIA states, roles, and keyboard navigation automatically.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Is it animated?</AccordionTrigger>
              <AccordionContent>
                Yes! It animates slide transitions on expand and collapse for a smooth, premium feel.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
