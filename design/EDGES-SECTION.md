# Advanced Section

## Current State

In my app, I have player sheets with multiple sections of different types. Below
is the code for a textbox section. It has two modes - display and edit. In
display mode, it shows the name and content, and in edit mode we can change the
name and content.

## New Section

I want to add a new section type - called "Trackable". It will have a name, which works the same as in the Text type. The content JSON should look like:

```json
{
    "showZeros": true,
    "items": [
        {
            "name": "Something",
            "length": 3,
            "ticked": 0,
            "dscription": "A long description about the item."
        },
        ...
    ]
}
```

In display mode, it should show, in tidy columns that fit the page, a block for each item in items formatted like: `Something [ ] [ ] [ ] (i)`. Those `[ ]` are checkboxes. The checkboxes should be positioned so that every item takes the same amount of space - and so that scanning down multiple of them in the same row, you'll see them all lined up. If `ticked` had been 2, then the first two would be ticked. If the user clicks on one that is ticked, I want to decrement ticked count and render with one less checkbox ticked. If an empty one is clicked, then add one to `ticked`. No matter which was selected, the ticked ones start from the left-most box for LTR languages, of the right-most for RTL languages. The `(i)` is an information icon, and if hovered over or clicked, should show the description. Showing the description should not re-arrange any of the other content on the page. The description should be dismissable. If "showZeros" is false, then any item with `ticked` equal to zero should not be shown, and should not be able to be changed to have less than one ticked.

In edit mode, It should have only one column of items. The name should be editable. There should be a +/- for the length, and there should be an editable textbox for the description. If the length is reduced below the number ticked, the number ticked should also be reduced. You cannot have a negative length, or greater than 10. There should also be a tick-box (one; not per-item), for "Show entries with no ticks" that the user can toggle.

In edit mode, the user should also be able to completely remove any item, and to add new ones.

## Existing Considerations

Please make sure to use the same internationalisation system, and general techniques, as the `sectionText.tsx` shown below.

## Existing Code

```typescript
import React, { useState } from 'react';
import { generateClient } from "aws-amplify/api";
import { SheetSection, UpdateSectionInput } from "../../appsync/graphql";
import { updateSectionMutation } from "../../appsync/schema";
import { FormattedMessage, useIntl } from 'react-intl';
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { FaPencilAlt } from 'react-icons/fa';
import { useToast } from './notificationToast';

type SectionTypeText = {
  text: string;
};

// Section component
export const SectionText: React.FC<{ section: SheetSection, userSubject: string, onUpdate: (updatedSection: SheetSection) => void }> = ({ section, userSubject, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(JSON.parse(section.content) as SectionTypeText);
  const [sectionName, setSectionName] = useState(section.sectionName);
  const [originalContent, setOriginalContent] = useState(content);
  const [originalSectionName, setOriginalSectionName] = useState(section.sectionName);
  const intl = useIntl(); // Get the intl object for translation
  const toast = useToast();

  const handleUpdate = async () => {
    try {
      const input: UpdateSectionInput = {
            gameId: section.gameId,
            sectionId: section.sectionId,
            sectionName: sectionName,
            sectionType: section.sectionType,
            content: JSON.stringify(content),
      }
      const client = generateClient();
      const response = await client.graphql({
        query: updateSectionMutation,
        variables: {
          input: input,
        }
      }) as GraphQLResult<{ updateSection: SheetSection }>;
      onUpdate(response.data.updateSection);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating section:", error);
      toast.addToast(intl.formatMessage({ id: "sectionText.updateError" }), 'error');

    }
  };

  const handleCancel = () => {
    // Reset the content and section name to their original values
    setContent(originalContent);
    setSectionName(originalSectionName);
    setIsEditing(false);
  };

  if (userSubject !== section.userId) {
    return (
      <div className="section">
        <h3>{sectionName}</h3>
        <p>{content.text}</p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="section">
        <input
          type="text"
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          placeholder={intl.formatMessage({ id: "sectionName" })}
        />
        <textarea
          value={content.text}
          onChange={(e) => setContent({ ...content, text: e.target.value })}
          placeholder={intl.formatMessage({ id: "sectionText.sampleContent" })}
        />
        <button onClick={handleUpdate}>
          <FormattedMessage id="save" />
        </button>
        <button onClick={handleCancel}>
          <FormattedMessage id="cancel" />
        </button>
      </div>
    );
  }

  return (
    <div className="section">
      <h3>{sectionName} <FaPencilAlt onClick={() => {
        setOriginalContent(content);
        setOriginalSectionName(section.sectionName);
        setIsEditing(true);
      }} /></h3>
      <p>{content.text}</p>
    </div>
  );
};
```

## Your Task

Please write the code for `sectionTrackable.tsx`.
