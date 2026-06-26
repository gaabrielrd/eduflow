export const validContentDocumentFixture = {
  version: 1,
  blocks: [
    {
      id: "block_1",
      type: "heading",
      props: {
        level: 2,
        text: "Introduction"
      }
    },
    {
      id: "block_2",
      type: "paragraph",
      props: {
        text: "Welcome to the lesson."
      }
    },
    {
      id: "block_3",
      type: "quote",
      props: {
        attribution: "Author",
        text: "Learning never exhausts the mind."
      }
    },
    {
      id: "block_4",
      type: "callout",
      props: {
        variant: "info",
        title: "Tip",
        text: "Review the glossary before continuing."
      }
    },
    {
      id: "block_5",
      type: "divider",
      props: {}
    },
    {
      id: "block_6",
      type: "image",
      props: {
        assetId: "media_image_1",
        alt: "Diagram placeholder",
        caption: "Illustration coming soon."
      }
    },
    {
      id: "block_7",
      type: "video",
      props: {
        title: "Demo placeholder",
        caption: "Video will be attached later."
      }
    },
    {
      id: "block_8",
      type: "file",
      props: {
        assetId: "media_file_1",
        title: "Worksheet placeholder",
        caption: "Supporting material will be uploaded later."
      }
    }
  ]
};

export const unsupportedVersionDocumentFixture = {
  ...validContentDocumentFixture,
  version: 2
};

export const unknownBlockTypeDocumentFixture = {
  version: 1,
  blocks: [
    {
      id: "block_unknown",
      type: "unknown",
      props: {}
    }
  ]
};

export const missingHeadingTextBlockFixture = {
  id: "block_missing_heading_text",
  type: "heading",
  props: {
    level: 2
  }
};

export const invalidHeadingLevelBlockFixture = {
  id: "block_invalid_heading_level",
  type: "heading",
  props: {
    level: 7,
    text: "Title"
  }
};

export const invalidCalloutVariantBlockFixture = {
  id: "block_invalid_callout_variant",
  type: "callout",
  props: {
    variant: "neutral",
    text: "Unsupported variant"
  }
};

export const rootUnknownFieldDocumentFixture = {
  version: 1,
  blocks: [],
  extra: true
};

export const blockUnknownFieldFixture = {
  id: "block_unknown_field",
  type: "heading",
  props: {
    level: 2,
    text: "Title"
  },
  extra: true
};

export const propsUnknownFieldFixture = {
  id: "block_props_unknown_field",
  type: "heading",
  props: {
    level: 2,
    text: "Title",
    extra: true
  }
};

export const minimalPlaceholderFixtures = {
  divider: {
    id: "divider_1",
    type: "divider",
    props: {}
  },
  image: {
    id: "image_1",
    type: "image",
    props: {
      assetId: "media_image_minimal"
    }
  },
  video: {
    id: "video_1",
    type: "video",
    props: {}
  },
  file: {
    id: "file_1",
    type: "file",
    props: {
      assetId: "media_file_minimal"
    }
  }
};
