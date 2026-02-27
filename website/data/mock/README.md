# Mock Data for Taxonomy Demo

This folder contains frontend-only mock data for taxonomy + multi-tag features.

## Files

- `tags.ts`: nested taxonomy tree and tag color palette.
- `goals-with-tags.ts`: seed goals + timeline items with `tagIds`.
- `large-goals-logs.json`: larger dataset for load/performance testing (many goals + many tagged timeline items).

## LocalStorage Persistence

The goals taxonomy demo persists edits in localStorage under:

- `loglife.goals-taxonomy.v1`

This stores:

- created tags
- updated goal tag assignments
- other in-memory edits made by the taxonomy UI

## Reset Demo State

In the browser console:

```js
localStorage.removeItem("loglife.goals-taxonomy.v1");
location.reload();
```

