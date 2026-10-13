// Remembers that a listing was opened from the results, so "Back to results" can
// go back in history (keeping the search, scroll and map as they were) instead of home.
let fromResults = false;

export const markFromResults = () => {
  fromResults = true;
};

export const cameFromResults = () => fromResults;
