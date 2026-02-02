import React from "react";

type SectionTitleProps = {
  children: React.ReactElement<{ className?: string }>;
};

const SectionTitle: React.FC<SectionTitleProps> = ({ children }) => {
  const existing = children.props.className ?? "";
  return React.cloneElement(children, {
    className:
      (existing ? existing + " " : "") +
      "text-3xl lg:text-5xl lg:leading-tight font-bold",
  });
};

export default SectionTitle;