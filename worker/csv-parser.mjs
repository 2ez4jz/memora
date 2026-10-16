import csvParserRuntime from 'papaparse';

// Keep parsing separate from customer validation and authorization.
export function csvRows(source, maxRows) {
  const result = csvParserRuntime.parse(source, {
    delimiter: ',',
    header: false,
    dynamicTyping: false,
    skipEmptyLines: 'greedy',
    preview: maxRows + 2,
    worker: false,
    download: false
  });
  if (result.errors.length) {
    const row = result.errors[0].row;
    throw Error('CSV 格式无效' + (Number.isInteger(row) ? '，请检查第 ' + (row + 1) + ' 行' : ''));
  }
  if (result.data.length > maxRows + 1) throw Error('Too many CSV rows');
  return result.data;
}
