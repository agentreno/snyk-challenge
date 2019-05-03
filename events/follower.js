const ChangesStream = require('changes-stream');
const db = 'https://replicate.npmjs.com';

var changes = new ChangesStream({
   db: db,
   include_docs: true,
//   filter: (doc, req) => doc.name == req.query.name,
//   filter: change => change.id == 'karl-snyk-challenge-hook',
//   query_params: {'name': 'karl-snyk-challenge-hook'}
});

changes.on('data', function(change) {
   if (change.id == 'karl-snyk-challenge-hook'){
      console.log(change);
   }
});
