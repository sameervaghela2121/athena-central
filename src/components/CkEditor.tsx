import React, { forwardRef, useEffect, useState } from "react";

// import { CKEditor } from "@ckeditor/ckeditor5-react";

// import {
//   AccessibilityHelp,
//   Alignment,
//   AutoImage,
//   AutoLink,
//   Autoformat,
//   Autosave,
//   BalloonToolbar,
//   BlockQuote,
//   Bold,
//   ClassicEditor,
//   CloudServices,
//   Code,
//   CodeBlock,
//   Essentials,
//   FindAndReplace,
//   FontBackgroundColor,
//   FontColor,
//   FontFamily,
//   FontSize,
//   GeneralHtmlSupport,
//   Heading,
//   Highlight,
//   HorizontalLine,
//   HtmlComment,
//   HtmlEmbed,
//   ImageBlock,
//   ImageInsertViaUrl,
//   ImageToolbar,
//   ImageUpload,
//   Indent,
//   IndentBlock,
//   Italic,
//   Link,
//   List,
//   Paragraph,
//   RemoveFormat,
//   SelectAll,
//   ShowBlocks,
//   SpecialCharacters,
//   SpecialCharactersArrows,
//   SpecialCharactersCurrency,
//   SpecialCharactersEssentials,
//   SpecialCharactersLatin,
//   SpecialCharactersMathematical,
//   SpecialCharactersText,
//   Strikethrough,
//   Style,
//   Subscript,
//   Superscript,
//   Table,
//   TableToolbar,
//   TextPartLanguage,
//   TextTransformation,
//   Underline,
//   Undo,
// } from "ckeditor5";

// import "ckeditor5/ckeditor5.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onChange: (data: any) => void;
  value: any;
  disabled?: boolean;
}
const CkEditor = forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, value, disabled }, ref) => {
    const [isLayoutReady, setIsLayoutReady] = useState(false);

    useEffect(() => {}, []);

    useEffect(() => {
      setIsLayoutReady(true);

      return () => setIsLayoutReady(false);
    }, []);

    const editorConfig: any = {
      toolbar: {
        items: [
          "undo",
          "redo",
          "|",
          "showBlocks",
          "findAndReplace",
          "|",
          "heading",
          "style",
          "bulletedList", // Added bulleted list
          "numberedList",
          "|",
          "fontSize",
          "fontFamily",
          "fontColor",
          "fontBackgroundColor",
          "|",
          "bold",
          "italic",
          "underline",
          "|",
          "alignment",
          "|",
          "outdent",
          "indent",
          "highlight",
          "strikethrough",
          "subscript",
          "superscript",

          "removeFormat",
          "|",
          "horizontalLine",
          "link",
          "insertTable",

          "blockQuote",
          "codeBlock",
          "htmlEmbed",
          "specialCharacters",
          "code",
        ],
        shouldNotGroupWhenFull: false,
      },
      // plugins: [
      //   List,
      //   AccessibilityHelp,
      //   Alignment,
      //   Autoformat,
      //   AutoImage,
      //   AutoLink,
      //   Autosave,
      //   BalloonToolbar,
      //   BlockQuote,
      //   // BlockToolbar,
      //   Bold,
      //   CloudServices,
      //   Code,
      //   CodeBlock,
      //   Essentials,
      //   FindAndReplace,
      //   FontBackgroundColor,
      //   FontColor,
      //   FontFamily,
      //   FontSize,
      //   GeneralHtmlSupport,
      //   Heading,
      //   Highlight,
      //   HorizontalLine,
      //   HtmlComment,
      //   HtmlEmbed,
      //   ImageBlock,
      //   ImageInsertViaUrl,
      //   ImageToolbar,
      //   ImageUpload,
      //   Indent,
      //   IndentBlock,
      //   Italic,
      //   Link,
      //   Paragraph,
      //   RemoveFormat,
      //   SelectAll,
      //   ShowBlocks,
      //   SpecialCharacters,
      //   SpecialCharactersArrows,
      //   SpecialCharactersCurrency,
      //   SpecialCharactersEssentials,
      //   SpecialCharactersLatin,
      //   SpecialCharactersMathematical,
      //   SpecialCharactersText,
      //   Strikethrough,
      //   Style,
      //   Subscript,
      //   Superscript,
      //   Table,
      //   TableToolbar,
      //   TextPartLanguage,
      //   TextTransformation,
      //   // Title,
      //   Underline,
      //   Undo,
      // ],
      tab: {
        spaces: 4, // Number of spaces for a tab
      },
      // balloonToolbar: ["bold", "italic", "|", "link"],
      blockToolbar: [
        "fontSize",
        "fontColor",
        "fontBackgroundColor",
        "|",
        "bold",
        "italic",
        "|",
        "link",
        "insertTable",
        "|",
        "outdent",
        "indent",
      ],
      fontFamily: {
        supportAllValues: true,
      },
      fontSize: {
        options: [10, 12, 14, "default", 18, 20, 22],
        supportAllValues: true,
      },
      heading: {
        options: [
          {
            model: "paragraph",
            title: "Paragraph",
            class: "ck-heading_paragraph",
          },
          {
            model: "heading1",
            view: "h1",
            title: "Heading 1",
            class: "ck-heading_heading1",
          },
          {
            model: "heading2",
            view: "h2",
            title: "Heading 2",
            class: "ck-heading_heading2",
          },
          {
            model: "heading3",
            view: "h3",
            title: "Heading 3",
            class: "ck-heading_heading3",
          },
          {
            model: "heading4",
            view: "h4",
            title: "Heading 4",
            class: "ck-heading_heading4",
          },
          {
            model: "heading5",
            view: "h5",
            title: "Heading 5",
            class: "ck-heading_heading5",
          },
          {
            model: "heading6",
            view: "h6",
            title: "Heading 6",
            class: "ck-heading_heading6",
          },
        ],
      },
      htmlSupport: {
        allow: [
          {
            name: /^.*$/,
            styles: true,
            attributes: true,
            classes: true,
          },
        ],
      },
      image: {
        toolbar: ["imageTextAlternative"],
      },
      initialData: "",
      link: {
        addTargetToExternalLinks: true,
        defaultProtocol: "https://",
        decorators: {
          toggleDownloadable: {
            mode: "manual",
            label: "Downloadable",
            attributes: {
              download: "file",
            },
          },
        },
      },
      placeholder: "",
      style: {
        definitions: [
          {
            name: "Article category",
            element: "h3",
            classes: ["category"],
          },
          {
            name: "Title",
            element: "h2",
            classes: ["document-title"],
          },
          {
            name: "Subtitle",
            element: "h3",
            classes: ["document-subtitle"],
          },
          {
            name: "Info box",
            element: "p",
            classes: ["info-box"],
          },
          {
            name: "Side quote",
            element: "blockquote",
            classes: ["side-quote"],
          },
          {
            name: "Marker",
            element: "span",
            classes: ["marker"],
          },
          {
            name: "Spoiler",
            element: "span",
            classes: ["spoiler"],
          },
          {
            name: "Code (dark)",
            element: "pre",
            classes: ["fancy-code", "fancy-code-dark"],
          },
          {
            name: "Code (bright)",
            element: "pre",
            classes: ["fancy-code", "fancy-code-bright"],
          },
        ],
      },
      table: {
        contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
      },
    };

    return (
      <div>
        <div className="main-container">
          <div className="editor-container editor-container_inline-editor editor-container_include-style editor-container_include-block-toolbar">
            <div className="editor-container__editor">
              {/* 
              <div>
                {isLayoutReady && (
                  <CKEditor
                    disabled={disabled}
                    editor={ClassicEditor}
                    config={editorConfig}
                    data={value ?? ""}
                    onChange={(event, editor) => {
                      const data = editor.getData();
                      onChange(data);
                    }}
                  />
                )}
              </div>
                  */}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default React.memo(CkEditor);
