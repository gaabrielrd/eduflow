import assert from "node:assert/strict";

import {
  contentDocumentSchema,
  dividerBlockSchema,
  fileBlockSchema,
  headingBlockSchema,
  imageBlockSchema,
  videoBlockSchema
} from "./dist/content-contract.js";

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest("accepts a valid v1 content document with every supported block", () => {
  const result = contentDocumentSchema.safeParse({
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
          title: "Worksheet placeholder",
          caption: "Supporting material will be uploaded later."
        }
      }
    ]
  });

  assert.equal(result.success, true);
});

runTest("rejects unsupported document versions", () => {
  const result = contentDocumentSchema.safeParse({
    version: 2,
    blocks: []
  });

  assert.equal(result.success, false);
});

runTest("rejects unknown block types", () => {
  const result = contentDocumentSchema.safeParse({
    version: 1,
    blocks: [
      {
        id: "block_1",
        type: "unknown",
        props: {}
      }
    ]
  });

  assert.equal(result.success, false);
});

runTest("rejects missing required fields and invalid heading levels", () => {
  const missingText = headingBlockSchema.safeParse({
    id: "block_1",
    type: "heading",
    props: {
      level: 2
    }
  });
  const invalidLevel = headingBlockSchema.safeParse({
    id: "block_1",
    type: "heading",
    props: {
      level: 7,
      text: "Title"
    }
  });

  assert.equal(missingText.success, false);
  assert.equal(invalidLevel.success, false);
});

runTest("rejects unknown fields on root, block, and props objects", () => {
  const rootResult = contentDocumentSchema.safeParse({
    version: 1,
    blocks: [],
    extra: true
  });
  const blockResult = headingBlockSchema.safeParse({
    id: "block_1",
    type: "heading",
    props: {
      level: 2,
      text: "Title"
    },
    extra: true
  });
  const propsResult = headingBlockSchema.safeParse({
    id: "block_1",
    type: "heading",
    props: {
      level: 2,
      text: "Title",
      extra: true
    }
  });

  assert.equal(rootResult.success, false);
  assert.equal(blockResult.success, false);
  assert.equal(propsResult.success, false);
});

runTest("accepts minimal placeholder blocks", () => {
  const dividerResult = dividerBlockSchema.safeParse({
    id: "divider_1",
    type: "divider",
    props: {}
  });
  const imageResult = imageBlockSchema.safeParse({
    id: "image_1",
    type: "image",
    props: {}
  });
  const videoResult = videoBlockSchema.safeParse({
    id: "video_1",
    type: "video",
    props: {}
  });
  const fileResult = fileBlockSchema.safeParse({
    id: "file_1",
    type: "file",
    props: {}
  });

  assert.equal(dividerResult.success, true);
  assert.equal(imageResult.success, true);
  assert.equal(videoResult.success, true);
  assert.equal(fileResult.success, true);
});
