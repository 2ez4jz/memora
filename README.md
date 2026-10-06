# Memora — dealership memory demo

A working browser demo of a small dealership’s operational memory and assistant.

## Run

Open `index.html` in a modern browser, or serve this repository with any static web host. No dependencies or API keys are required.

## Included

- 80 fictional customers, 18 vehicles, 160 linked interactions and 8 sales.
- Dashboard with calculated pipeline counts, follow-up queue, revenue and gross vehicle profit.
- Searchable customer memories and inventory, buyer matching, conversation history.
- Memora assistant: Chinese or English demo queries for follow-ups, vehicle demand, recorded objections, matching, customer details, revenue and profit charts.
- Conversation capture: text or optional browser speech recognition, editable extraction preview and confirmation before saving.
- Browser-local changes and reset.

## Demo limits

The assistant uses deterministic rules, not a language model. Unsupported questions return an explicit limitation. Field extraction is rule based and requires review. Data is fictional and stored in this browser’s localStorage, not a server database; it does not sync across devices or users. Voice support depends on browser support, permission and the browser’s speech service.

All relative dates are evaluated against the fixed demo date **October 6, 2026**. Currency is CAD. Demand charts count conversations, not unique customers. Pipeline charts show current stages, not conversion rates. Gross vehicle profit subtracts acquisition cost only. Matching uses brand, body type, budget and recorded interest; no predictive probability or external market pricing is provided. Completed sales are seeded examples; this version does not record new financial transactions. Capturing a note does not send a message to the customer.

Demo data uses fictional names, example.com email addresses and 555 telephone numbers.

## Suggested walkthrough

1. Open Overview and review the follow-up shortlist.
2. Open Alex Chen’s customer memory.
3. Ask Memora: `我今天应该联系谁？`
4. Ask: `BMW X3 为什么卖不掉？`
5. Ask: `最近一个月销售收入，按销售员出图`
6. Capture a memory, choose **Use example**, review and save.
7. Ask: `Alex Chen 的情况怎么样？` to see the updated note.

## Next implementation

Replace local demo storage with a shared database, add server-side OpenAI queries and transcription, then authentication and team permissions. Preserve the visible capture → review → save → query workflow.
