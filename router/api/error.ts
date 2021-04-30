import { Response } from 'express';

const errTexts: any = {
    'unknown_error': '알 수 없는 오류가 발생했습니다.',

    'content_not_exists': '내용을 입력해 주세요.',
    'problemId_not_exists': '문제 번호를 입력해 주세요.',
    'choiceNum_not_exists': '보기 번호를 입력해 주세요.',
    'name_not_exists': '이름을 입력해 주세요.',

    'survey_not_exists': '설문지가 존재하지 않습니다.',
    'problem_not_exists': '문제가 존재하지 않습니다.',
    'choice_not_exists': '보기가 존재하지 않습니다.',
    'image_not_exists': '이미지가 존재하지 않습니다.',
    'pc_not_exists': '문제 혹은 보기가 존재하지 않습니다.',

    'number_already_exists': '이미 존재하는 번호입니다.',
    'survey_already_exists': '설문지가 이미 존재합니다.',
    
    'problem_not_deleted': '삭제된 문제가 아니거나 존재하지 않는 문제입니다.',
    'invalid_input': '잘못된 입력입니다.',
    'no_input': '입력값이 없습니다.'
}

function sendErrorResponse(res: Response, statusCode: number, errText: string, err?: Error) {
    console.log("ERROR handled by sendErrorResponse");
    console.log("ERROR PARAM: statusCode" + statusCode + ", errText" + errText);
    console.log("ERROR: ");
    console.log(err);

    if (errText && errTexts[errText]) {
        res
            .status(statusCode)
            .json({
                'error': errTexts[errText]
            });
        return;
    }

    res.sendStatus(statusCode);
}

export default sendErrorResponse;