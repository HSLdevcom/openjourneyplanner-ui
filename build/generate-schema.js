/* eslint-disable import/no-extraneous-dependencies, no-console */
const fs = require('fs');
const http = require('https');

const graphqlSchemaSource =
  process.env.SCHEMA_SRC ||
  'https://raw.githubusercontent.com/HSLdevcom/OpenTripPlanner/dev-2.x/application/src/main/resources/org/opentripplanner/apis/gtfs/schema.graphqls';
const outputGraphQLFilename = 'schema.graphql';
const outputGraphQLFileCopy = `../digitransit-search-util/packages/digitransit-search-util-query-utils/schema/${outputGraphQLFilename}`;

const copySchema = (src, dest) => {
  fs.copyFile(src, dest, err => {
    if (err) {
      throw err;
    }
    console.log(`${src} was copied to ${dest}`);
  });
};

if (graphqlSchemaSource.includes('http')) {
  const file = fs.createWriteStream(outputGraphQLFilename);
  http.get(graphqlSchemaSource, response => {
    response.pipe(file);

    file.on('finish', () => {
      file.close();
      console.log(`GraphQL schema saved to ${outputGraphQLFilename}`);
      copySchema(outputGraphQLFilename, outputGraphQLFileCopy);
    });
  });
} else {
  copySchema(graphqlSchemaSource, outputGraphQLFilename);
  copySchema(graphqlSchemaSource, outputGraphQLFileCopy);
}
