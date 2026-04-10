async function getFreshGoogleCreds(creds) {
  const { getFreshCreds } = await import('../../../GoogleWorkspace.js');
  return getFreshCreds(creds);
}

const FORMS_BASE = 'https://forms.googleapis.com/v1/forms';

async function formsFetch(creds, url, options = {}) {
  const fresh = await getFreshGoogleCreds(creds);
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${fresh.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `Forms API error (${res.status}): ${body.error?.message ?? JSON.stringify(body)}`,
    );
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function getForm(creds, formId) {
  return formsFetch(creds, `${FORMS_BASE}/${formId}`);
}

export async function listResponses(creds, formId, { maxResults = 50, filter } = {}) {
  const params = new URLSearchParams({ pageSize: String(Math.min(maxResults, 5000)) });
  if (filter) params.set('filter', filter);
  const data = await formsFetch(creds, `${FORMS_BASE}/${formId}/responses?${params}`);
  return {
    responses: data.responses ?? [],
    totalResponses: data.totalSize ?? 0,
  };
}

export async function getResponse(creds, formId, responseId) {
  return formsFetch(creds, `${FORMS_BASE}/${formId}/responses/${responseId}`);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function extractQuestions(form) {
  const questions = [];
  for (const item of form.items ?? []) {
    const q = {
      itemId: item.itemId,
      title: item.title ?? '',
      description: item.description ?? '',
      type: 'UNKNOWN',
      required: false,
      questionId: null,
    };

    if (item.questionItem) {
      const question = item.questionItem.question;
      q.questionId = question?.questionId ?? null;
      q.required = question?.required ?? false;

      if (question?.choiceQuestion)
        q.type = question.choiceQuestion.type; // RADIO | CHECKBOX | DROP_DOWN
      else if (question?.textQuestion) q.type = 'TEXT';
      else if (question?.scaleQuestion) q.type = 'SCALE';
      else if (question?.dateQuestion) q.type = 'DATE';
      else if (question?.timeQuestion) q.type = 'TIME';
      else if (question?.fileUploadQuestion) q.type = 'FILE_UPLOAD';
      else if (question?.rowQuestion) q.type = 'ROW';

      if (question?.choiceQuestion?.options) {
        q.options = question.choiceQuestion.options.map((o) => o.value);
      }
      if (question?.scaleQuestion) {
        q.scale = { low: question.scaleQuestion.low, high: question.scaleQuestion.high };
      }
    } else if (item.questionGroupItem) {
      q.type = 'QUESTION_GROUP';
    } else if (item.pageBreakItem) {
      q.type = 'PAGE_BREAK';
    } else if (item.textItem) {
      q.type = 'SECTION_TEXT';
    } else if (item.imageItem) {
      q.type = 'IMAGE';
    } else if (item.videoItem) {
      q.type = 'VIDEO';
    }

    questions.push(q);
  }
  return questions;
}

export function extractAnswerValue(answer) {
  if (!answer) return '(no answer)';
  if (answer.textAnswers?.answers?.length) {
    return answer.textAnswers.answers.map((a) => a.value).join(', ');
  }
  if (answer.fileUploadAnswers?.answers?.length) {
    return answer.fileUploadAnswers.answers
      .map((a) => a.fileId ?? a.fileName ?? '(file)')
      .join(', ');
  }
  return '(no answer)';
}
