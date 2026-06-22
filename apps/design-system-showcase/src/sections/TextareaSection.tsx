import { useState } from 'react';
import { Textarea, Label, FormField } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function TextareaSection() {
  const [comment, setComment] = useState('');
  const [bio, setBio] = useState('Senior Frontend Engineer with 8+ years of experience building design systems.');
  const [feedback, setFeedback] = useState('');

  return (
    <SectionWrapper
      id="textarea"
      title="Textarea"
      overline="Component"
      description="Multi-line text input field, useful for paragraph-length inputs and descriptions."
    >
      <Subsection title="States" stack>
        <div className="flex flex-col gap-6 w-full max-w-md">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ta-default">Default Textarea</Label>
            <Textarea
              id="ta-default"
              placeholder="Enter your thoughts here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ta-disabled" disabled>Disabled Textarea</Label>
            <Textarea
              id="ta-disabled"
              disabled
              placeholder="Cannot edit this content..."
              value="This field is disabled and read-only."
              onChange={() => {}}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ta-invalid">Invalid Textarea</Label>
            <Textarea
              id="ta-invalid"
              invalid
              placeholder="Tell us what went wrong..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
        </div>
      </Subsection>

      <Subsection title="Form Field Integration" stack>
        <div className="flex flex-col gap-6 w-full max-w-md">
          <FormField
            label="User Biography"
            helpText="This will be displayed publicly on your profile page."
          >
            <Textarea
              rows={4}
              placeholder="Write a little about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </FormField>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
