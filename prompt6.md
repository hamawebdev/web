endpoint /quizzes/question-count request does not have repeated questions field and always return 0 decipite there is questions in the database.
request :
```json
{"courseIds":[4,5],"questionTypes":["MULTIPLE_CHOICE","SINGLE_CHOICE","QROC"],"years":[2024],"questionSourceIds":[2],"universityIds":[1],"rotations":[]}
```
response : 
```json
{"success":true,"data":{"totalQuestionCount":0,"accessibleQuestionCount":0},"meta":{"timestamp":"2026-02-10T14:19:08.072Z","requestId":"wbfagv7zz8"}}
```