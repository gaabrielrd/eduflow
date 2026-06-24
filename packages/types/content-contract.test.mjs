import assert from "node:assert/strict";

import {
  blockUnknownFieldFixture,
  invalidCalloutVariantBlockFixture,
  invalidHeadingLevelBlockFixture,
  minimalPlaceholderFixtures,
  missingHeadingTextBlockFixture,
  propsUnknownFieldFixture,
  rootUnknownFieldDocumentFixture,
  unknownBlockTypeDocumentFixture,
  unsupportedVersionDocumentFixture,
  validContentDocumentFixture
} from "./content-contract.fixtures.mjs";
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
  const result = contentDocumentSchema.safeParse(validContentDocumentFixture);

  assert.equal(result.success, true);
});

runTest("rejects unsupported document versions", () => {
  const result = contentDocumentSchema.safeParse(unsupportedVersionDocumentFixture);

  assert.equal(result.success, false);
});

runTest("rejects unknown block types", () => {
  const result = contentDocumentSchema.safeParse(unknownBlockTypeDocumentFixture);

  assert.equal(result.success, false);
});

runTest("rejects missing required heading props and invalid heading levels", () => {
  const missingText = headingBlockSchema.safeParse(missingHeadingTextBlockFixture);
  const invalidLevel = headingBlockSchema.safeParse(invalidHeadingLevelBlockFixture);

  assert.equal(missingText.success, false);
  assert.equal(invalidLevel.success, false);
});

runTest("rejects invalid enum values for constrained block props", () => {
  const result = contentDocumentSchema.safeParse({
    version: 1,
    blocks: [invalidCalloutVariantBlockFixture]
  });

  assert.equal(result.success, false);
});

runTest("rejects unknown fields on root, block, and props objects", () => {
  const rootResult = contentDocumentSchema.safeParse(rootUnknownFieldDocumentFixture);
  const blockResult = headingBlockSchema.safeParse(blockUnknownFieldFixture);
  const propsResult = headingBlockSchema.safeParse(propsUnknownFieldFixture);

  assert.equal(rootResult.success, false);
  assert.equal(blockResult.success, false);
  assert.equal(propsResult.success, false);
});

runTest("accepts minimal placeholder blocks", () => {
  const dividerResult = dividerBlockSchema.safeParse(minimalPlaceholderFixtures.divider);
  const imageResult = imageBlockSchema.safeParse(minimalPlaceholderFixtures.image);
  const videoResult = videoBlockSchema.safeParse(minimalPlaceholderFixtures.video);
  const fileResult = fileBlockSchema.safeParse(minimalPlaceholderFixtures.file);

  assert.equal(dividerResult.success, true);
  assert.equal(imageResult.success, true);
  assert.equal(videoResult.success, true);
  assert.equal(fileResult.success, true);
});
