import * as DocsAPI from '../API/DocsAPI.js';
import { requireGoogleCredentials } from '../../../Common.js';

export async function executeDocsChatTool(ctx, toolName, params = {}) {
  const credentials = requireGoogleCredentials(ctx);

  switch (toolName) {
    case 'docs_get_info': {
      const { document_id } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      const doc = await DocsAPI.getDocument(credentials, document_id.trim());
      const bodyContent = doc.body?.content ?? [];
      const totalChars = bodyContent
        .flatMap((el) => el.paragraph?.elements ?? [])
        .reduce((n, el) => n + (el.textRun?.content?.length ?? 0), 0);

      return [
        `**${doc.title ?? 'Untitled'}**`,
        `Document ID: \`${doc.documentId}\``,
        doc.documentStyle?.pageSize
          ? `Page size: ${doc.documentStyle.pageSize.width?.magnitude?.toFixed(0)} × ${doc.documentStyle.pageSize.height?.magnitude?.toFixed(0)} pt`
          : '',
        `~${totalChars.toLocaleString()} characters`,
        doc.revisionId ? `Revision: ${doc.revisionId}` : '',
        `Link: https://docs.google.com/document/d/${doc.documentId}/edit`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'docs_read': {
      const { document_id } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      const doc = await DocsAPI.getDocument(credentials, document_id.trim());
      const { text, truncated } = DocsAPI.extractText(doc);
      if (!text.trim()) return `Document "${doc.title ?? document_id}" is empty.`;
      return [
        `**${doc.title ?? 'Untitled'}**`,
        truncated ? 'Showing the first 30,000 characters.' : '',
        '',
        '```',
        text,
        '```',
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'docs_create': {
      const { title } = params;
      if (!title?.trim()) throw new Error('Missing required param: title');
      const doc = await DocsAPI.createDocument(credentials, title.trim());
      return [
        'Document created',
        `Title: ${doc.title}`,
        `ID: \`${doc.documentId}\``,
        `Link: https://docs.google.com/document/d/${doc.documentId}/edit`,
      ].join('\n');
    }

    case 'docs_append_text': {
      const { document_id, text } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (!text) throw new Error('Missing required param: text');
      await DocsAPI.appendText(credentials, document_id.trim(), String(text));
      return `Text appended to document \`${document_id}\`.`;
    }

    case 'docs_prepend_text': {
      const { document_id, text } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (!text) throw new Error('Missing required param: text');
      // Index 1 is the start of the document body
      await DocsAPI.insertText(credentials, document_id.trim(), String(text), 1);
      return `Text prepended to document \`${document_id}\`.`;
    }

    case 'docs_insert_text': {
      const { document_id, text, index = 1 } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (!text) throw new Error('Missing required param: text');
      if (typeof index !== 'number' || index < 1)
        throw new Error('param index must be a number >= 1');
      await DocsAPI.insertText(credentials, document_id.trim(), String(text), index);
      return `Text inserted at index ${index} in document \`${document_id}\`.`;
    }

    case 'docs_replace_text': {
      const { document_id, search_text, replacement } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (!search_text) throw new Error('Missing required param: search_text');
      if (replacement == null) throw new Error('Missing required param: replacement');
      const result = await DocsAPI.replaceAllText(
        credentials,
        document_id.trim(),
        search_text,
        String(replacement),
      );
      const count = result.replies?.[0]?.replaceAllText?.occurrencesChanged ?? 0;
      return count > 0
        ? `Replaced ${count} occurrence${count !== 1 ? 's' : ''} of "${search_text}" in document \`${document_id}\`.`
        : `No occurrences of "${search_text}" found in the document.`;
    }

    case 'docs_delete_range': {
      const { document_id, start_index, end_index } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (start_index == null) throw new Error('Missing required param: start_index');
      if (end_index == null) throw new Error('Missing required param: end_index');
      if (start_index < 1) throw new Error('start_index must be >= 1');
      if (end_index <= start_index) throw new Error('end_index must be greater than start_index');
      await DocsAPI.deleteContentRange(credentials, document_id.trim(), start_index, end_index);
      return `Deleted characters ${start_index}–${end_index} from document \`${document_id}\`.`;
    }

    case 'docs_clear_content': {
      const { document_id } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      const doc = await DocsAPI.getDocument(credentials, document_id.trim());
      const bodyContent = doc.body?.content ?? [];
      const lastEl = bodyContent.at(-1);
      const endIndex = lastEl?.endIndex ?? 1;
      // endIndex - 1 because the final newline/sentinel cannot be deleted
      if (endIndex <= 2) return `Document \`${document_id}\` is already empty.`;
      await DocsAPI.deleteContentRange(credentials, document_id.trim(), 1, endIndex - 1);
      return `All content cleared from document \`${document_id}\`.`;
    }

    default:
      throw new Error(`Unknown Docs tool: ${toolName}`);
  }
}
