import { expect, test } from "@playwright/test";
import {
  getUnifiedMentalMapChallenges,
  selectNextUnifiedMentalMapChallenge
} from "../../src/atlas/mental-map-challenge-registry.js";

test("regional U.S. spatial questions stay varied and uniquely identified", () => {
  const regionalPool = getUnifiedMentalMapChallenges({ includeGenerated: false });
  const ids = regionalPool.map((question) => question.id);
  const gulfCoastQuestions = regionalPool.filter((question) => (
    /gulf/i.test(`${question.id} ${question.title} ${question.prompt}`)
  ));

  expect(regionalPool.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
  expect(gulfCoastQuestions.length).toBeGreaterThanOrEqual(3);

  const first = gulfCoastQuestions[0];
  const next = selectNextUnifiedMentalMapChallenge(gulfCoastQuestions, {
    usedQuestionIds: new Set(),
    lastQuestionId: first.id,
    random: () => 0
  });
  expect(next).not.toBeNull();
  expect(next.id).not.toBe(first.id);
});
