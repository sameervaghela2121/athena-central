import { Delta } from "quill";
import React, { forwardRef, useEffect, useRef } from "react";
import ReactQuill from "react-quill";
import { toast } from "sonner";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onChange: (data: any) => void;
  value: any;
  disabled?: boolean;
}
const QuillEditor = forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, value, disabled }, ref) => {
    const quillRef = useRef<any>(null);

    useEffect(() => {
      if (quillRef.current) {
        const quill = quillRef.current.getEditor();

        quill.clipboard.addMatcher(
          Node.ELEMENT_NODE,
          (node: { tagName: string }, delta: any) => {
            if (node.tagName === "IMG") {
              toast.error("Uploading Images are not allowed", {
                id: "image-not-allowed",
              });
              return new Delta(); // Prevent image pasting
            }
            return delta;
          },
        );
      }
    }, []);

    const modules = {
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"], // Text styling
        [{ list: "ordered" }, { list: "bullet" }],
        [{ script: "sub" }, { script: "super" }],
        [{ indent: "-1" }, { indent: "+1" }], // Indentation
        [{ direction: "rtl" }], // Text direction
        [{ size: ["small", false, "large", "huge"] }], // Font sizes
        [{ color: [] }, { background: [] }], // Dropdown with defaults
        [{ font: [] }],
        [{ align: [] }],
        ["link"], // Links and media
        ["clean"], // Remove formatting
      ],
      clipboard: {
        matchVisual: true, // Ensures styles from pasted content match editor
      },
    };

    const formats = [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "list",
      "bullet",
      "script",
      "indent",
      "direction",
      "size",
      "color",
      "background",
      "font",
      "align",
      "link",
      "image",
      "video",
    ];

    return (
      <div className="bg-white rounded-lg main-container">
        <ReactQuill
          ref={quillRef}
          className="border-none"
          readOnly={disabled}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
        />
      </div>
    );
  },
);

export default React.memo(QuillEditor);
