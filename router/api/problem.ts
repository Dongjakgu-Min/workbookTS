import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import uuid from 'uuid';
import db from '../../models';
import tool from './tool';
import sendErrorResponse from './error';
import { promises } from 'fs';

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req: Request, file: any, cb: Function) {
        cb(null, 'uploads/')
    },
    filename: function (req: Request, file: any, cb: Function) {
        cb(null, req.newFileName + path.extname(file.originalname));
    }
});

function fileFilter(res: Request, file: any, cb: Function) {
    const extension: string = file.mimetype.split('/')[0];

    if (extension === 'image') //Check && Upload...
        return cb(null, true);

    return cb(new Error('업로드를 지원하지 않는 형식의 파일입니다.'), false);
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

router.put('/:problemId', async function (req: Request, res: Response) {
    const problemId: string = req.params.problemId;
    const updateId: string = req.body.problemId;
    const content: string = req.body.content;
    const update: Record<string, unknown> = {};

    if (updateId) update.problemId = updateId;
    if (content) update.content = content;
    if (!updateId && !content) return sendErrorResponse(res, 400, 'invalid_input');

    try {
        const problem: any = await db.Problem.findOne({
            id: problemId,
            isDeleted: false
        });

        if (!problem)
            return sendErrorResponse(res, 404, 'problem_not_exist');

        const survey: any = await db.Survey.findOne({
            id: problem.surveyId
        });

        if (!survey || survey.isDeleted)
            return sendErrorResponse(res, 404, 'survey_not_exists');

        if (updateId) {
            const dup = await db.Problem.findOne({
                id: updateId,
                isDeleted: false
            });

            if (dup)
                return sendErrorResponse(res, 403, 'number_already_exists');
        }

        await db.Problem.updateOne({
            id: problemId,
            isDeleted: false
        }, update);

        res.sendStatus(200);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.delete('/:problemId', async function (req: Request, res: Response) {
    const problemId: string = req.params.problemId;
    const content: string = req.body.content;

    if (!content)
        return sendErrorResponse(res, 400, 'content_not_exists');

    try {
        const problem: any = await db.Problem.findOne({
            id: problemId,
            isDeleted: false
        });

        if (!problem)
            return sendErrorResponse(res, 404, 'problem_not_exists');

        const survey = await db.Survey.findOne({
            id: problem.surveyId,
            isDeleted: false
        });

        if (!survey)
            return sendErrorResponse(res, 404, 'survey_not_exists');

        await db.Problem.updateOne({
            id: problemId,
            isDeleted: false
        }, {
            isDeleted: true
        });

        res.sendStatus(200);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.post('/:problemId/answer', async function (req: Request, res: Response) {
    const content: string = req.body.content;
    const problemId: string = req.params.problemId;

    const type: string = tool.getType(content);
    if (type != 'Number' && type != 'String' && type != 'Boolean')
        return sendErrorResponse(res, 403, 'invalid_input');

    try {
        const problem = await db.Problem.findOne({
            id: problemId,
            isDeleted: false
        });

        if (!problem)
            return sendErrorResponse(res, 404, 'problem_not_exists');

        await new db.Answer({
            problemId: problemId,
            content
        }).save();

        res.sendStatus(200);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.get('/:problemId/answer', async function (req: Request, res: Response) {
    const problemId: string = req.params.problemId;

    try {
        const problem = await db.Problem.findOne({
            id: problemId,
            isDeleted: false
        });

        if (!problem)
            return sendErrorResponse(res, 404, 'problem_not_exists');

        const answer = await db.Answer.find({
            problemId: problemId
        });

        res.json(answer);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.post('/:problemId/choice', async function (req: Request, res: Response) {
    const problemId: string = req.params.problemId;
    const choiceNum: string = req.body.choiceNum;
    const content: string = req.body.content;
    const choice: Record<string, unknown> = {};

    if (!choiceNum) return res.status(400).send('choiceNum을 입력해 주세요.');
    if (!content) return res.status(400).send('content를 입력해 주세요.');

    try {
        const problem = await db.Problem.findOne({
            id: problemId,
            isDeleted: false
        });

        if (!problem)
            return sendErrorResponse(res, 404, 'problem_not_exists');

        const choiceCheck = await db.Problem.findOne({
            id: problemId,
            isDeleted: false,
            'choice.isDeleted': false,
            'choice.choiceNum': choiceNum
        });

        if (choiceCheck)
            return sendErrorResponse(res, 403, 'number_already_exists')

        choice.content = content;
        choice.choiceNum = choiceNum;

        await db.Problem.updateOne({
            id: problemId,
            isDeleted: false
        }, {
            $push: {
                choice
            }
        });

        return res.sendStatus(200);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.get('/:problemId/choice/deleted', async function (req: Request, res: Response) {
    const problemId: string = req.params.problemId;

    try {
        const problem = await db.Problem.findOne({
            id: problemId,
            isDeleted: false
        });

        if (!problem)
            return sendErrorResponse(res, 404, 'problem_not_exists');

        const choice = await db.Problem.find({
            id: problemId,
            isDeleted: false,
            'choice.isDeleted': true
        });

        res.json(choice);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.put('/:problemId/recover', async function (req: Request, res: Response) {
    const problemId: string = req.params.problemId;

    try {
        const problem: any = await db.Problem.findOne({
            id: problemId,
            isDeleted: false
        });

        if (!problem)
            return sendErrorResponse(res, 404, 'problem_not_exists');

        const survey: any = await db.Survey.findOne({
            id: problem.surveyId
        })

        if (!survey || survey.isDeleted)
            return sendErrorResponse(res, 404, 'survey_not_exists');

        await db.Problem.updateOne({
            id: problemId,
            isDeleted: true
        }, {
            isDeleted: false
        });

        res.sendStatus(200);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.put('/:problemId/choice/:choiceNum', async function (req: Request, res: Response) {
    const problemId: string = req.params.problemId;
    const choiceNum: string = req.params.choiceNum;
    const updateNum: string = req.body.choiceNum;
    const content: string = req.body.content;

    const update: Record<string, unknown> = {};

    if (content) update['choice.$.content'] = content;
    if (updateNum) update['choice.$.choiceNum'] = updateNum;
    if (!content && !choiceNum) return sendErrorResponse(res, 400, 'invalid_input');

    try {
        const problem: any = await db.Problem.findOne({
            id: problemId,
            isDeleted: false,
            'choice.choiceNum': choiceNum,
            'choice.isDelete': false
        });

        if (!problem)
            return sendErrorResponse(res, 404, 'pc_not_exists');

        const survey: any = await db.Survey.findOne({
            id: problem.surveyId
        })

        if (!survey || survey.isDeleted)
            return sendErrorResponse(res, 404, 'survey_not_exists');

        if (updateNum !== undefined) {
            const dup = await db.Problem.findOne({
                id: problemId,
                isDeleted: false,
                'choice.choiceNum': updateNum,
                'choice.isDeleted': false
            });

            if (dup)
                return sendErrorResponse(res, 403, 'number_already_exists');
        }

        await db.Problem.updateOne({
            id: problemId,
            isDeleted: false,
            'choice.choiceNum': choiceNum,
            'choice.isDelete': false
        }, update);

        res.sendStatus(200);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.delete('/:problemId/choice/:choiceNum', async function (req: Request, res: Response) {
    const problemId: string = req.params.problemId;
    const choiceNum: string = req.params.choiceNum;

    try {
        const choice: any = await db.Problem.findOne({
            id: problemId,
            isDeleted: false,
            'choice.choiceNum': choiceNum,
            'choice.isDeleted': false
        });

        if (!choice)
            return sendErrorResponse(res, 404, 'pc_not_exists');

        const survey: any = await db.Survey.findOne({
            id: choice.surveyId
        })

        if (!survey || survey.isDeleted)
            return sendErrorResponse(res, 404, 'survey_not_exists');

        await db.Problem.updateOne({
            id: problemId,
            isDeleted: false,
            'choice.choiceNum': choiceNum,
            'choice.isDeleted': false
        }, {
            'choice.$.isDeleted': true
        });

        res.sendStatus(200);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.put('/:problemId/choice/:choiceNum/recover', async function (req: Request, res: Response) {
    const problemId: string = req.params.problemId;
    const choiceNum: string = req.params.choiceNum;

    try {
        const choice: any = await db.Problem.findOne({
            id: problemId,
            isDeleted: false,
            'choice.choiceNum': choiceNum,
            'choice.isDeleted': true
        });

        if (!choice)
            return sendErrorResponse(res, 404, 'pc_not_exists');

        const survey: any = await db.Survey.findOne({
            id: choice.surveyId
        })

        if (!survey || survey.isDeleted)
            return sendErrorResponse(res, 404, 'survey_not_exists');

        await db.Problem.updateOne({
            id: problemId,
            isDeleted: false,
            'choice.choiceNum': choiceNum,
            'choice.isDeleted': true
        }, {
            'choice.$.isDeletd': false
        });

        res.sendStatus(200);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.post('/:problemId/choice/:choiceNum/pic',
    function (req: Request, file: object, next: Function) {
        req.newFileName = uuid.v4();
        next();
    },
    upload.single('attachment'),
    async function (req: Request, res: Response) {
        const problemId: string = req.params.problemId;
        const choiceNum: string = req.params.choiceNum;
        const file = req.file;

        const ext = file.originalname.split('.');
        const filename = req.newFileName + '.' + ext[ext.length - 1];

        try {
            const picture: any = await db.Problem.findOne({
                'id': problemId,
                'isDeleted': false,
                'choice.choiceNum': choiceNum,
                'choice.isDeleted': false
            });

            if (!picture) {
                await promises.unlink('./uploads/' + filename);
                return sendErrorResponse(res, 404, 'pc_not_exists');
            }

            const survey: any = await db.Survey.findOne({
                id: picture.surveyId
            });

            if (!survey || survey.isDeleted) {
                await promises.unlink('./uploads/' + filename);
                return sendErrorResponse(res, 404, 'survey_not_exists');
            }


            await db.Problem.updateOne({
                'id': problemId,
                'choice.choiceNum': choiceNum,
                'choice.isDeleted': false
            }, {
                $set: {
                    'choice.$.image': filename
                }
            });

            res.sendStatus(200);
        } catch (err) {
            sendErrorResponse(res, 500, 'unknown_error', err);
        }
    }
);

router.get('/:problemId/choice/:choiceNum/pic', async function (req: Request, res: Response) {
    const problemId = req.params.problemId;
    const choiceNum = req.params.choiceNum;

    try {
        const problem: any = await db.Problem.findOne({
            'id': problemId,
            'choice.choiceNum': choiceNum
        });

        if (!problem)
            return sendErrorResponse(res, 404, 'pc_not_exists');

        const survey: any = await db.Survey.findOne({
            id: problem.surveyId
        })

        if (!survey || survey.isDeleted)
            return sendErrorResponse(res, 404, 'survey_not_exists');

        if (!problem) return sendErrorResponse(res, 404, 'problem_not_exists');
        if (!problem.choice) return sendErrorResponse(res, 404, 'choice_not_exists');
        if (!problem.choice[0].image) return sendErrorResponse(res, 404, 'image_not_exists');

        res.download('./uploads/' + problem.choice[0].image, problem.choice[0].image);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.put('/:problemId/choice/:choiceNum/pic',
    function (req: Request, file: object, next: Function) {
        req.newFileName = uuid.v4();
        next();
    },
    upload.single('attachment'),
    async function (req: Request, res: Response) {
        const problemId: string = req.params.problemId;
        const choiceNum: string = req.params.choiceNum;
        const file = req.file;

        const ext = file.originalname.split('.');
        const filename = req.newFileName + '.' + ext[ext.length - 1];

        try {
            const picture: any = await db.Problem.findOne({
                'id': problemId,
                'isDeleted': false,
                'choice.choiceNum': choiceNum,
                'choice.isDeleted': false
            });

            if (!picture) {
                await promises.unlink('./uploads/' + filename);
                return sendErrorResponse(res, 404, 'pc_not_exists');
            }

            const survey: any = await db.Survey.findOne({
                id: picture.surveyId
            });

            if (!survey || survey.isDeleted) {
                await promises.unlink('./uploads/' + filename);
                return sendErrorResponse(res, 404, 'survey_not_exists');
            }

            await promises.unlink('./uploads/' + picture.choice[0].image);

            await db.Problem.updateOne({
                'id': problemId,
                'choice.choiceNum': choiceNum,
                'choice.isDeleted': false
            }, {
                $set: {
                    'choice.$.image': filename
                }
            });

            res.sendStatus(200);
        } catch (err) {
            sendErrorResponse(res, 500, 'unknown_error', err);
        }
    }
);

router.delete('/:problemId/choice/:choiceNum/pic', async function (req: Request, res: Response) {
    const problemId: string = req.params.problemId;
    const choiceNum: string = req.params.choiceNum;

    try {
        const picture: any = await db.Problem.findOne({
            'id': problemId,
            'isDeleted': false,
            'choice.choiceNum': choiceNum,
            'choice.isDeleted': false
        });

        if (!picture)
            return sendErrorResponse(res, 404, 'pc_not_exists');

        const survey: any = await db.Survey.findOne({
            id: picture.surveyId
        });

        if (!survey || survey.isDeleted)
            return sendErrorResponse(res, 404, 'survey_not_exists');

        await promises.unlink('./uploads/' + picture.choice[0].image);

        await db.Problem.updateOne({
            'id': problemId,
            'choice.choiceNum': choiceNum,
            'choice.isDeleted': false
        }, {
            $unset: {
                'choice.$.image': picture.choice[0].image
            }
        });

        res.sendStatus(200);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

export default router;