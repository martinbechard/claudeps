export const getOrganizationId = jest.fn().mockReturnValue("test-org-id");
export const getIdsFromUrl = jest.fn().mockReturnValue({
  projectId: null,
  conversationId: "test-conv-id",
});
export const getProjectUuid = jest.fn().mockResolvedValue("test-project-id");
