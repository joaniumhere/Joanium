import * as FormsAPI from '../API/FormsAPI.js';
import { requireGoogleCredentials } from '../../../Common.js';

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function typeLabel(type) {
  const map = {
    RADIO: 'Multiple choice',
    CHECKBOX: 'Checkboxes',
    DROP_DOWN: 'Dropdown',
    TEXT: 'Short/long answer',
    SCALE: 'Linear scale',
    DATE: 'Date',
    TIME: 'Time',
    FILE_UPLOAD: 'File upload',
    PAGE_BREAK: 'Page break',
    SECTION_TEXT: 'Section header',
    IMAGE: 'Image',
    VIDEO: 'Video',
    QUESTION_GROUP: 'Grid',
    UNKNOWN: 'Unknown',
  };
  return map[type] ?? type;
}

export async function executeFormsChatTool(ctx, toolName, params = {}) {
  const credentials = requireGoogleCredentials(ctx);

  switch (toolName) {
    case 'forms_get_form': {
      const { form_id } = params;
      if (!form_id?.trim()) throw new Error('Missing required param: form_id');

      const form = await FormsAPI.getForm(credentials, form_id.trim());
      const questions = FormsAPI.extractQuestions(form);
      const questionItems = questions.filter(
        (q) => !['PAGE_BREAK', 'SECTION_TEXT', 'IMAGE', 'VIDEO'].includes(q.type),
      );

      const lines = [
        `**${form.info?.title ?? 'Untitled Form'}**`,
        form.info?.description ? `Description: ${form.info.description}` : '',
        `Form ID: \`${form.formId}\``,
        `Link: ${form.responderUri ?? `https://docs.google.com/forms/d/${form.formId}/viewform`}`,
        `Questions: ${questionItems.length}`,
        '',
        '── Questions ──',
      ];

      questions.forEach((q, i) => {
        if (['PAGE_BREAK', 'SECTION_TEXT'].includes(q.type)) {
          lines.push(`\n— ${q.title || 'Section'} —`);
          return;
        }
        if (['IMAGE', 'VIDEO'].includes(q.type)) return;

        const reqFlag = q.required ? ' *(required)*' : '';
        lines.push(`\n${i + 1}. **${q.title || '(Untitled question)'}**${reqFlag}`);
        lines.push(`   Type: ${typeLabel(q.type)}`);
        if (q.description) lines.push(`   Description: ${q.description}`);
        if (q.options?.length) lines.push(`   Options: ${q.options.join(' · ')}`);
        if (q.scale) lines.push(`   Scale: ${q.scale.low} – ${q.scale.high}`);
        if (q.questionId) lines.push(`   Question ID: \`${q.questionId}\``);
      });

      return lines.filter((v) => v !== null && v !== undefined).join('\n');
    }

    case 'forms_get_summary': {
      const { form_id } = params;
      if (!form_id?.trim()) throw new Error('Missing required param: form_id');

      const [form, { totalResponses }] = await Promise.all([
        FormsAPI.getForm(credentials, form_id.trim()),
        FormsAPI.listResponses(credentials, form_id.trim(), { maxResults: 1 }),
      ]);

      const questions = FormsAPI.extractQuestions(form);
      const answerableCount = questions.filter(
        (q) => !['PAGE_BREAK', 'SECTION_TEXT', 'IMAGE', 'VIDEO'].includes(q.type),
      ).length;

      return [
        `**${form.info?.title ?? 'Untitled Form'}**`,
        form.info?.description ? `Description: ${form.info.description}` : '',
        '',
        `Form ID: \`${form.formId}\``,
        `Responder link: ${form.responderUri ?? `https://docs.google.com/forms/d/${form.formId}/viewform`}`,
        `Edit link: https://docs.google.com/forms/d/${form.formId}/edit`,
        '',
        `Total questions: ${answerableCount}`,
        `Total responses: ${totalResponses}`,
        form.settings?.quizSettings ? 'Type: Quiz' : 'Type: Form',
        form.settings?.quizSettings?.isQuiz ? `Points possible: tracked` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'forms_list_responses': {
      const { form_id, max_results = 50 } = params;
      if (!form_id?.trim()) throw new Error('Missing required param: form_id');

      const form = await FormsAPI.getForm(credentials, form_id.trim());
      const { responses, totalResponses } = await FormsAPI.listResponses(
        credentials,
        form_id.trim(),
        { maxResults: max_results },
      );

      if (!responses.length) {
        return `No responses found for form "${form.info?.title ?? form_id}".`;
      }

      // Build question ID → title map for readable output
      const questions = FormsAPI.extractQuestions(form);
      const qMap = Object.fromEntries(
        questions.filter((q) => q.questionId).map((q) => [q.questionId, q.title || '(Untitled)']),
      );

      const sections = responses.map((resp, i) => {
        const header = [
          `Response ${i + 1}`,
          `  Response ID: \`${resp.responseId}\``,
          resp.createTime ? `  Submitted: ${formatDate(resp.createTime)}` : '',
          resp.respondentEmail ? `  Respondent: ${resp.respondentEmail}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        const answers = Object.entries(resp.answers ?? {}).map(([qId, answer]) => {
          const qTitle = qMap[qId] ?? qId;
          const value = FormsAPI.extractAnswerValue(answer);
          return `  Q: ${qTitle}\n  A: ${value}`;
        });

        return [header, ...answers].join('\n');
      });

      return [
        `**${form.info?.title ?? 'Form'}** — ${responses.length} of ${totalResponses} response(s)`,
        '',
        sections.join('\n\n── ── ──\n\n'),
      ].join('\n');
    }

    case 'forms_get_response': {
      const { form_id, response_id } = params;
      if (!form_id?.trim()) throw new Error('Missing required param: form_id');
      if (!response_id?.trim()) throw new Error('Missing required param: response_id');

      const [form, resp] = await Promise.all([
        FormsAPI.getForm(credentials, form_id.trim()),
        FormsAPI.getResponse(credentials, form_id.trim(), response_id.trim()),
      ]);

      const questions = FormsAPI.extractQuestions(form);
      const qMap = Object.fromEntries(
        questions.filter((q) => q.questionId).map((q) => [q.questionId, q.title || '(Untitled)']),
      );

      const lines = [
        `Response \`${resp.responseId}\``,
        resp.createTime ? `Submitted: ${formatDate(resp.createTime)}` : '',
        resp.respondentEmail ? `Respondent: ${resp.respondentEmail}` : '',
        resp.totalScore != null ? `Score: ${resp.totalScore}` : '',
        '',
        '── Answers ──',
      ];

      for (const [qId, answer] of Object.entries(resp.answers ?? {})) {
        const qTitle = qMap[qId] ?? qId;
        const value = FormsAPI.extractAnswerValue(answer);
        lines.push(`\nQ: ${qTitle}`);
        lines.push(`A: ${value}`);
        if (answer.grade) {
          lines.push(
            `   Score: ${answer.grade.score ?? 0} / ${answer.grade.questionScore?.maxPoints ?? '?'}`,
          );
          if (answer.grade.correct !== undefined) {
            lines.push(`   Correct: ${answer.grade.correct ? 'Yes' : 'No'}`);
          }
        }
      }

      return lines.filter(Boolean).join('\n');
    }

    default:
      throw new Error(`Unknown Forms tool: ${toolName}`);
  }
}
