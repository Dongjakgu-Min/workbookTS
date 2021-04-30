import express, { Request, Response } from 'express';
import db from '../../models';
import sendErrorResponse from './error';
const router = express.Router();

router.post('/',  async function (req: Request, res: Response) {
    const name: string = req.body.name;

    if (!name)
        return sendErrorResponse(res, 400, 'name_not_exists');

    try {
        const surveyCheck = await db.Survey.findOne({
            name: name,
            isDeleted: false
        });

        if (surveyCheck)
            return sendErrorResponse(res, 403, 'survey_already_exists');

        await new db.Survey({
            name: name
        }).save();

        res.sendStatus(200);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.get('/', async function (req: Request, res: Response) {
    const { isDeleted } = req.query;

    try {
        if (!isDeleted) {
            const surveys = await db.Survey.find({
                isDeleted: false
            });

            res.json(surveys);
        } else {
            const surveys = await db.Survey.find({
                isDeleted: true
            });

            res.json(surveys);
        }
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.get('/:surveyId', async function (req: Request, res: Response) {
    const surveyId: string = req.params.surveyId;

    try {
        const survey = await db.Survey.findOne({
            id: surveyId,
            isDeleted: false
        });

        if (!survey)
            return sendErrorResponse(res, 403, 'survey_not_exists');

        res.json(survey);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.get('/:surveyId/problem', async function (req: Request, res: Response) {
    const { surveyId } = req.params;
    const { isDeleted } = req.query;

    try {
        const survey: any = await db.Survey.findOne({
            id: surveyId
        });

        if (!survey || survey.isDeleted)
            return sendErrorResponse(res, 404, 'survey_not_exists');

        if (!isDeleted) {
            const problems = await db.Problem.find({
                surveyId,
                isDeleted: false
            });
    
            res.json(problems);
        } else {
            const problems = await db.Problem.find({
                surveyId,
                isDeleted: true
            });
    
            res.json(problems);
        }
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
})

router.put('/:surveyId', async function (req: Request, res: Response) {
    const surveyId: string = req.params.surveyId;
    const name: string = req.body.name;

    if (!name)
        return sendErrorResponse(res, 400, 'name_not_exists');

    try {
        const survey = await db.Survey.findOne({
            id: surveyId
        });

        if (!survey)
            return sendErrorResponse(res, 404, 'survey_not_exists');

        const sameName = await db.Survey.findOne({
            name,
            isDeleted: false
        });

        if (sameName)
            return sendErrorResponse(res, 403, 'survey_already_exists');

        await db.Survey.updateOne({
            id: surveyId
        }, {
            name: name
        });

        res.sendStatus(200);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.delete('/:surveyId', async function (req: Request, res: Response) {
    const surveyId: string = req.params.surveyId;

    try {
        const survey = await db.Survey.findOne({
            id: surveyId,
            isDeleted: false
        });

        if (!survey)
            return sendErrorResponse(res, 404, 'survey_not_exists');

        await db.Survey.updateOne({
            id: surveyId,
            isDeleted: false
        }, {
            isDeleted: true
        });

        res.sendStatus(200);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.put('/:surveyId/recover', async function (req: Request, res: Response) {
    const surveyId: string = req.params.surveyId;

    try {
        const survey = await db.Survey.findOne({
            id: surveyId,
            isDeleted: true
        });

        if (!survey)
            return sendErrorResponse(res, 404, 'survey_not_exists');
        
        await db.Survey.updateOne({
            id: surveyId,
            isDeleted: true
        }, {
            isDeleted: false
        });

        return res.sendStatus(200);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

router.post('/:surveyId/problem', async function (req: Request, res: Response) {
    const surveyId: string = req.params.surveyId;
    const content: string = req.body.content;
    const problemId: string = req.body.problemId;

    if (!content)
        return sendErrorResponse(res, 400, 'content_not_exists');
    if (!problemId)
        return sendErrorResponse(res, 400, 'problemId_not_exists');

    try {
        const Problem = await db.Problem.findOne({
            problemId,
            surveyId,
            isDeleted: false
        });

        if (Problem)
            return sendErrorResponse(res, 403, 'problem_already_exists');

        await new db.Problem({
            problemId,
            surveyId,
            content
        }).save();

        res.sendStatus(200);
    } catch (err) {
        sendErrorResponse(res, 500, 'unknown_error', err);
    }
});

export default router;