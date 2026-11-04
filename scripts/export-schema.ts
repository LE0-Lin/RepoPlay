import {writeFileSync} from 'node:fs';
import {z} from 'zod';
import {tourSchema,documentSchema} from '../lib/tour';
writeFileSync('docs/tour.schema.json',JSON.stringify(z.toJSONSchema(tourSchema,{io:'input',unrepresentable:'any'}),null,2)+'\n');
writeFileSync('docs/tour-document.schema.json',JSON.stringify(z.toJSONSchema(documentSchema,{io:'input',unrepresentable:'any'}),null,2)+'\n');
console.log('Exported structural JSON Schemas. Runtime validators also check flow relationships, budgets and source references.');
