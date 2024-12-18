import {
  hasMessageLimitReached,
  checkMessageLimitForRetry,
  MessageLimitError,
} from "@/utils/messageUtils";

describe("hasMessageLimitReached", () => {
  it("should return true when message limit text is found in correct structure", () => {
    document.body.innerHTML = `
      <div class="text-danger-000 flex flex-row items-center gap-2 md:w-full">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" class="h-4 w-4 shrink-0">
          <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z"></path>
        </svg>
        <div>
          <div class="text-sm">Message limit reached for Claude 3.5 Sonnet until <span class="inline-block">3 AM.</span>
            <div class="text-text-300">You may still be able to continue on Claude 3.5 Haiku</div>
          </div>
        </div>
      </div>
    `;

    expect(hasMessageLimitReached(document.body)).toBe(true);
  });

  it("should return false when error class is not present", () => {
    document.body.innerHTML = `
      <div class="some-other-class">
        <div>
          <div>Message limit reached for Claude 3.5 Sonnet</div>
        </div>
      </div>
    `;

    expect(hasMessageLimitReached(document.body)).toBe(false);
  });

  it("should return false when message limit text is not present", () => {
    document.body.innerHTML = `
      <div class="text-danger-000">
        <div>
          <div>Some other error message</div>
        </div>
      </div>
    `;

    expect(hasMessageLimitReached(document.body)).toBe(false);
  });

  it("should return false when element is empty", () => {
    document.body.innerHTML = "";
    expect(hasMessageLimitReached(document.body)).toBe(false);
  });
});

describe("checkMessageLimitForRetry", () => {
  beforeEach(() => {
    // Mock getComputedStyle
    window.getComputedStyle = jest.fn().mockReturnValue({ display: "block" });
  });

  it("should throw MessageLimitError when limit is reached and error div is displayed", () => {
    document.body.innerHTML = `
      <div class="text-danger-000">
        <div>Message limit reached for Claude 3.5 Sonnet</div>
      </div>
    `;

    expect(() => checkMessageLimitForRetry()).toThrow(MessageLimitError);
  });

  it("should not throw when error div is hidden", () => {
    document.body.innerHTML = `
      <div class="text-danger-000">
        <div>Message limit reached for Claude 3.5 Sonnet</div>
      </div>
    `;

    (window.getComputedStyle as jest.Mock).mockReturnValue({ display: "none" });

    expect(() => checkMessageLimitForRetry()).not.toThrow();
  });

  it("should not throw when error div is not present", () => {
    document.body.innerHTML = `
      <div class="some-other-class">
        <div>Some other content</div>
      </div>
    `;

    expect(() => checkMessageLimitForRetry()).not.toThrow();
  });

  it("should not throw when message limit text is not present", () => {
    document.body.innerHTML = `
      <div class="text-danger-000">
        <div>Some other error message</div>
      </div>
    `;

    expect(() => checkMessageLimitForRetry()).not.toThrow();
  });
});
