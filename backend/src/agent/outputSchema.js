export const ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    topic: { type: "string" },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          outlet: { type: "string" },
          url: { type: "string" },
          date: { type: "string" },
          headline: { type: "string" },
        },
        required: ["outlet", "url", "date", "headline"],
        additionalProperties: false,
      },
    },
    agreed_facts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          fact: { type: "string" },
          supporting_outlets: { type: "array", items: { type: "string" } },
        },
        required: ["fact", "supporting_outlets"],
        additionalProperties: false,
      },
    },
    disputed_or_unique_claims: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claim: { type: "string" },
          outlets_making_it: { type: "array", items: { type: "string" } },
          outlets_not_mentioning_it: { type: "array", items: { type: "string" } },
        },
        required: ["claim", "outlets_making_it", "outlets_not_mentioning_it"],
        additionalProperties: false,
      },
    },
    framing_by_outlet: {
      type: "array",
      items: {
        type: "object",
        properties: {
          outlet: { type: "string" },
          tone: {
            type: "string",
            enum: ["neutral", "critical", "supportive", "alarmist"],
          },
          emphasis: { type: "string" },
          notable_word_choices: { type: "array", items: { type: "string" } },
          what_it_leaves_out: { type: "string" },
        },
        required: [
          "outlet",
          "tone",
          "emphasis",
          "notable_word_choices",
          "what_it_leaves_out",
        ],
        additionalProperties: false,
      },
    },
    summary: { type: "string" },
    caveats: { type: "array", items: { type: "string" } },
  },
  required: [
    "topic",
    "sources",
    "agreed_facts",
    "disputed_or_unique_claims",
    "framing_by_outlet",
    "summary",
    "caveats",
  ],
  additionalProperties: false,
};
