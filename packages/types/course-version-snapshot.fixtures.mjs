import { validContentDocumentFixture } from "./content-contract.fixtures.mjs";

export const validCourseVersionSnapshotFixture = {
  schemaVersion: 1,
  publishedAt: "2026-06-27T12:00:00.000Z",
  publishedBy: {
    id: "user_1",
    name: "Instructor Name"
  },
  course: {
    id: "course_1",
    organizationId: "org_1",
    title: "Course title",
    slug: "course-title",
    description: null
  },
  modules: [
    {
      id: "module_1",
      title: "First module",
      description: null,
      position: 1,
      lessonIds: ["lesson_1", "lesson_2"]
    },
    {
      id: "module_2",
      title: "Second module",
      description: "Additional practice",
      position: 2,
      lessonIds: ["lesson_3"]
    }
  ],
  lessons: [
    {
      id: "lesson_1",
      moduleId: "module_1",
      title: "Introduction",
      description: null,
      contentType: "TEXT",
      position: 1,
      estimatedDurationMinutes: 10,
      isPreview: true
    },
    {
      id: "lesson_2",
      moduleId: "module_1",
      title: "Resources",
      description: "Downloadable assets",
      contentType: "FILE",
      position: 2,
      estimatedDurationMinutes: null,
      isPreview: false
    },
    {
      id: "lesson_3",
      moduleId: "module_2",
      title: "Review",
      description: null,
      contentType: "TEXT",
      position: 1,
      estimatedDurationMinutes: 5,
      isPreview: false
    }
  ],
  lessonDetails: [
    {
      id: "lesson_1",
      moduleId: "module_1",
      title: "Introduction",
      description: null,
      contentType: "TEXT",
      position: 1,
      estimatedDurationMinutes: 10,
      isPreview: true,
      contentJson: validContentDocumentFixture,
      media: [
        {
          id: "media_image_1",
          url: "https://cdn.example.com/media/image.png",
          fileName: "image.png",
          originalName: "Diagram.png",
          mimeType: "image/png",
          sizeBytes: 12345
        },
        {
          id: "media_file_1",
          url: "https://cdn.example.com/media/worksheet.pdf",
          fileName: "worksheet.pdf",
          originalName: "Worksheet.pdf",
          mimeType: "application/pdf",
          sizeBytes: 45678
        }
      ]
    },
    {
      id: "lesson_2",
      moduleId: "module_1",
      title: "Resources",
      description: "Downloadable assets",
      contentType: "FILE",
      position: 2,
      estimatedDurationMinutes: null,
      isPreview: false,
      contentJson: {
        version: 1,
        blocks: [
          {
            id: "file_1",
            type: "file",
            props: {
              assetId: "media_file_2",
              title: "Extra worksheet"
            }
          }
        ]
      },
      media: [
        {
          id: "media_file_2",
          url: "https://cdn.example.com/media/extra-worksheet.pdf",
          fileName: "extra-worksheet.pdf",
          originalName: "Extra worksheet.pdf",
          mimeType: "application/pdf",
          sizeBytes: 56789
        }
      ]
    },
    {
      id: "lesson_3",
      moduleId: "module_2",
      title: "Review",
      description: null,
      contentType: "TEXT",
      position: 1,
      estimatedDurationMinutes: 5,
      isPreview: false,
      contentJson: {
        version: 1,
        blocks: [
          {
            id: "paragraph_1",
            type: "paragraph",
            props: {
              text: "Review what you learned."
            }
          }
        ]
      },
      media: []
    }
  ]
};

export const validCourseVersionLessonDetailFixture =
  validCourseVersionSnapshotFixture.lessonDetails[0];
