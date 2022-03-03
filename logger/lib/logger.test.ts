import { LogFormat, LogLevel } from './common';

const mockEnv = {
    AWS_REGION: "us-test-1",
    AWS_LAMBDA_FUNCTION_NAME: "unitTest",
    AWS_LAMBDA_FUNCTION_VERSION: "2",
    AWS_LAMBDA_FUNCTION_MEMORY_SIZE: "128",
    ENVIRONMENT: "",
    STAGE: "",
    SERVERLESS_STAGE: "test",
    _X_AMZN_TRACE_ID: "",
};

const timestampRegEx = /^20\d\d-\d\d-\d\dT\d\d:\d\d:.*/;

describe('Logger', () => {
    let Logger;
    // let originalConsoleLog;
    let mockLog: jest.Mock;
    let mockDebug: jest.Mock;
    let mockInfo: jest.Mock;
    let mockWarn: jest.Mock;
    let mockError: jest.Mock;

    beforeEach(() => {
        Object.assign(process.env, mockEnv);
        // originalConsoleLog = global.console.log;
        global.console.log = mockLog = jest.fn();
        global.console.debug = mockDebug = jest.fn();
        global.console.info = mockInfo = jest.fn();
        global.console.warn = mockWarn = jest.fn();
        global.console.error = mockError = jest.fn();
        Logger = require('./logger').Logger;
    });

    // afterEach(() => {
    //     global.console.log = originalConsoleLog;
    //     mockLog = undefined as any;
    // });

    describe('globalLogLevel', () => {
        test('set to "NONE" with environment variable', () => {
            // GIVEN
            process.env.LOG_LEVEL = 'NONE';
            jest.resetModules();

            // WHEN
            Logger = require('./logger').Logger;

            // THEN
            expect(new Logger("").level).toBe(1);
        });
    });

    describe('configured for AWS CloudWatch environment', () => {
        beforeEach(() => {
            Logger.initialize({
                level: LogLevel.DEBUG,
                outputLevels: false,
                logTimestamps: false,
                format: LogFormat.FLAT,
            });
        });

        describe('debug level', () => {
            test('debug(message) to CloudWatch', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");

                // WHEN
                logger.debug('message');

                // THEN
                expect(mockLog).not.toHaveBeenCalled();
                expect(mockDebug).toHaveBeenCalledTimes(1);
                expect(mockDebug).toHaveBeenCalledWith("LoggerTest:", "message");
            });

            test('debug(message, params) to CloudWatch', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");

                // WHEN
                logger.debug('message', 1, true, 'third');

                // THEN
                expect(mockDebug).toHaveBeenCalledWith(
                    "LoggerTest:", "message", 1, true, "third"
                );
            });

            test('debug(message) to CloudWatch when log level is WARN', () => {
                // GIVEN
                const logger = new Logger({
                    category: "LoggerTest",
                    level: LogLevel.WARN,
                });

                // WHEN
                logger.debug('message');

                // THEN
                expect(mockLog).not.toHaveBeenCalled();
                expect(mockDebug).not.toHaveBeenCalled();
            });

            test('debugObject(message, object) to CloudWatch', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                const obj = {message: "I'm a teapot", statusCode: 418};

                // WHEN
                logger.debugObject('Formatted ', obj);

                // THEN
                expect(mockDebug).toHaveBeenCalledWith(
                    "LoggerTest:",
                    "Formatted ", "{\"message\":\"I'm a teapot\",\"statusCode\":418}"
                );
            });

            test('debugObject(message) to CloudWatch when log level is INFO', () => {
                // GIVEN
                const logger = new Logger({
                    category: "LoggerTest",
                    level: LogLevel.INFO,
                });

                // WHEN
                logger.debugObject('message', {});

                // THEN
                expect(mockDebug).not.toHaveBeenCalled();
            });
        });

        describe('info level', () => {
            test.only('info(message) to CloudWatch', () => {
                // GIVEN
                const logger = new Logger({ category: "LoggerTest", format: LogFormat.STRUCT });

                // WHEN
                logger.info('text');

                // THEN
                expect(mockInfo).toHaveBeenCalledWith(expect.any(String));
                expect(JSON.parse(mockInfo.mock.calls[0][0])).toEqual({
                    aws_region: mockEnv.AWS_REGION,
                    function_name: mockEnv.AWS_LAMBDA_FUNCTION_NAME,
                    function_version: mockEnv.AWS_LAMBDA_FUNCTION_VERSION,
                    stage: mockEnv.SERVERLESS_STAGE,
                    level: "INFO",
                    message: "text",
                    category: "LoggerTest",
                    timestamp: expect.stringMatching(timestampRegEx),
                });

                // expect(mockInfo.mock.calls[0].length).toBe(2);
                // expect(mockInfo.mock.calls[0][0]).toEqual("LoggerTest:");
                // expect(mockInfo.mock.calls[0][1]).toEqual("message");
            });

            test('info(message, params) to CloudWatch', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");

                // WHEN
                logger.info('message', 1, true, 'third');

                // THEN
                expect(mockInfo.mock.calls.length).toBe(1);
                expect(mockInfo.mock.calls[0].length).toBe(5);
                expect(mockInfo.mock.calls[0][0]).toEqual("LoggerTest:");
                expect(mockInfo.mock.calls[0][1]).toEqual("message");
                expect(mockInfo.mock.calls[0][2]).toEqual(1);
                expect(mockInfo.mock.calls[0][3]).toEqual(true);
                expect(mockInfo.mock.calls[0][4]).toEqual('third');
            });

            test('info(message) to CloudWatch when log level is WARN', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                Logger.globalLogLevel = LogLevel.WARN;

                // WHEN
                logger.info('message');

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockInfo.mock.calls.length).toBe(0);
            });

            test('infoObject(message, object) to CloudWatch', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                const obj = {message: "I'm a teapot", statusCode: 418};

                // WHEN
                logger.infoObject('Formatted ', obj);

                // THEN
                expect(mockInfo.mock.calls.length).toBe(1);
                expect(mockInfo.mock.calls[0].length).toBe(2);
                expect(mockInfo.mock.calls[0][0]).toEqual("LoggerTest:");
                expect(mockInfo.mock.calls[0][1]).toEqual("Formatted {\"message\":\"I'm a teapot\",\"statusCode\":418}");
            });

            test('infoObject(message) to CloudWatch when log level is NONE', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                Logger.globalLogLevel = LogLevel.NONE;

                // WHEN
                logger.infoObject('message', {});

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockInfo.mock.calls.length).toBe(0);
            });
        });

        describe('warn level', () => {
            test('warn(message) to CloudWatch', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");

                // WHEN
                logger.warn('message');

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockWarn.mock.calls.length).toBe(1);
                expect(mockWarn.mock.calls[0].length).toBe(2);
                expect(mockWarn.mock.calls[0][0]).toEqual("LoggerTest:");
                expect(mockWarn.mock.calls[0][1]).toEqual("message");
            });

            test('warn(message, params) to CloudWatch', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");

                // WHEN
                logger.warn('message', 1, true, 'third');

                // THEN
                expect(mockWarn.mock.calls.length).toBe(1);
                expect(mockWarn.mock.calls[0].length).toBe(5);
                expect(mockWarn.mock.calls[0][0]).toEqual("LoggerTest:");
                expect(mockWarn.mock.calls[0][1]).toEqual("message");
                expect(mockWarn.mock.calls[0][2]).toEqual(1);
                expect(mockWarn.mock.calls[0][3]).toEqual(true);
                expect(mockWarn.mock.calls[0][4]).toEqual('third');
            });

            test('warn(message) to CloudWatch when log level is ERROR', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                Logger.globalLogLevel = LogLevel.ERROR;

                // WHEN
                logger.warn('message');

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockWarn.mock.calls.length).toBe(0);
            });

            test('warnObject(message, object) to CloudWatch', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                const obj = {message: "I'm a teapot", statusCode: 418};

                // WHEN
                logger.warnObject('Formatted ', obj);

                // THEN
                expect(mockWarn.mock.calls.length).toBe(1);
                expect(mockWarn.mock.calls[0].length).toBe(2);
                expect(mockWarn.mock.calls[0][0]).toEqual("LoggerTest:");
                expect(mockWarn.mock.calls[0][1]).toEqual("Formatted {\"message\":\"I'm a teapot\",\"statusCode\":418}");
            });

            test('warnObject(message) to CloudWatch when log level is NONE', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                Logger.globalLogLevel = LogLevel.NONE;

                // WHEN
                logger.warnObject('message', {});

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockWarn.mock.calls.length).toBe(0);
            });
        });

        describe('error level', () => {
            test('error(message) to CloudWatch', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");

                // WHEN
                logger.error('message');

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockError.mock.calls.length).toBe(1);
                expect(mockError.mock.calls[0].length).toBe(2);
                expect(mockError.mock.calls[0][0]).toEqual("LoggerTest:");
                expect(mockError.mock.calls[0][1]).toEqual("message");
            });

            test('error(message, params) to CloudWatch', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");

                // WHEN
                logger.error('message', 1, true, 'third');

                // THEN
                expect(mockError.mock.calls.length).toBe(1);
                expect(mockError.mock.calls[0].length).toBe(5);
                expect(mockError.mock.calls[0][0]).toEqual("LoggerTest:");
                expect(mockError.mock.calls[0][1]).toEqual("message");
                expect(mockError.mock.calls[0][2]).toEqual(1);
                expect(mockError.mock.calls[0][3]).toEqual(true);
                expect(mockError.mock.calls[0][4]).toEqual('third');
            });

            test('error(message) to CloudWatch when log level is NONE', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                Logger.globalLogLevel = LogLevel.NONE;

                // WHEN
                logger.error('message');

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockWarn.mock.calls.length).toBe(0);
            });

            test('errorObject(message, object) to CloudWatch', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                const obj = {message: "I'm a teapot", statusCode: 418};

                // WHEN
                logger.errorObject('Formatted ', obj);

                // THEN
                expect(mockError.mock.calls.length).toBe(1);
                expect(mockError.mock.calls[0].length).toBe(2);
                expect(mockError.mock.calls[0][0]).toEqual("LoggerTest:");
                expect(mockError.mock.calls[0][1]).toEqual("Formatted {\"message\":\"I'm a teapot\",\"statusCode\":418}");
            });

            test('errorObject(message) to CloudWatch when log level is NONE', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                Logger.globalLogLevel = LogLevel.NONE;

                // WHEN
                logger.errorObject('message', {});

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockWarn.mock.calls.length).toBe(0);
            });
        });
    });

    describe('configured for local console environment', () => {
        beforeEach(() => {
            Logger.globalLogLevel = LogLevel.DEBUG;
            Logger.outputLevels = true;
            Logger.logTimestamps = true;
            Logger.formatObjects = true;
        });

        describe('debug level', () => {
            test('debug(message) to console', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");

                // WHEN
                logger.debug('message');

                // THEN
                expect(mockDebug.mock.calls.length).toBe(1);
                expect(mockDebug.mock.calls[0].length).toBe(4);
                expect(mockDebug.mock.calls[0][0]).toMatch(/^....-..-..T..:..:..$/);
                expect(mockDebug.mock.calls[0][1]).toEqual('DEBUG');
                expect(mockDebug.mock.calls[0][2]).toEqual('LoggerTest:');
                expect(mockDebug.mock.calls[0][3]).toEqual('message');
            });

            test('debug(message, params) to console', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");

                // WHEN
                logger.debug('message', 1, true, 'third');

                // THEN
                expect(mockDebug.mock.calls.length).toBe(1);
                expect(mockDebug.mock.calls[0].length).toBe(7);
                expect(mockDebug.mock.calls[0][0]).toMatch(/^....-..-..T..:..:..$/);
                expect(mockDebug.mock.calls[0][1]).toEqual('DEBUG');
                expect(mockDebug.mock.calls[0][2]).toEqual('LoggerTest:');
                expect(mockDebug.mock.calls[0][3]).toEqual('message');
                expect(mockDebug.mock.calls[0][4]).toEqual(1);
                expect(mockDebug.mock.calls[0][5]).toEqual(true);
                expect(mockDebug.mock.calls[0][6]).toEqual('third');
            });

            test('debugObject(message, object) to console', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                const obj = {message: "I'm a teapot", statusCode: 418};

                // WHEN
                logger.debugObject('Formatted ', obj);

                // THEN
                expect(mockDebug.mock.calls.length).toBe(1);
                expect(mockDebug.mock.calls[0].length).toBe(4);
                expect(mockDebug.mock.calls[0][0]).toMatch(/^....-..-..T..:..:..$/);
                expect(mockDebug.mock.calls[0][1]).toEqual('DEBUG');
                expect(mockDebug.mock.calls[0][2]).toEqual('LoggerTest:');
                expect(mockDebug.mock.calls[0][3]).toEqual("Formatted {\n  \"message\": \"I'm a teapot\",\n  \"statusCode\": 418\n}");
                // expect(mockDebug.mock.calls[0][0].substr(0, 20)).toMatch(/^....-..-..T..:..:.. $/);
                // expect(mockDebug.mock.calls[0][0].substr(20)).toEqual("DEBUG LoggerTest: Formatted {\n  \"message\": \"I'm a teapot\",\n  \"statusCode\": 418\n}");
            });

            test('debug(message) to console when log level is INFO', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                Logger.globalLogLevel = LogLevel.INFO;

                // WHEN
                logger.debug('message');

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockDebug.mock.calls.length).toBe(0);
            });
        });

        describe('info level', () => {
            test('info(message) to console', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");

                // WHEN
                logger.info('message');

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockInfo.mock.calls.length).toBe(1);
                expect(mockInfo.mock.calls[0].length).toBe(4);
                expect(mockInfo.mock.calls[0][0]).toMatch(/^....-..-..T..:..:..$/);
                expect(mockInfo.mock.calls[0][1]).toEqual('INFO');
                expect(mockInfo.mock.calls[0][2]).toEqual('LoggerTest:');
                expect(mockInfo.mock.calls[0][3]).toEqual('message');
            });

            test('info(message, params) to console', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");

                // WHEN
                logger.info('message', 1, true, 'third');

                // THEN
                expect(mockInfo.mock.calls.length).toBe(1);
                expect(mockInfo.mock.calls[0].length).toBe(7);
                expect(mockInfo.mock.calls[0][0]).toMatch(/^....-..-..T..:..:..$/);
                expect(mockInfo.mock.calls[0][1]).toEqual('INFO');
                expect(mockInfo.mock.calls[0][2]).toEqual('LoggerTest:');
                expect(mockInfo.mock.calls[0][3]).toEqual('message');
                expect(mockInfo.mock.calls[0][4]).toEqual(1);
                expect(mockInfo.mock.calls[0][5]).toEqual(true);
                expect(mockInfo.mock.calls[0][6]).toEqual('third');
            });

            test('info(message) to console when log level is WARN', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                Logger.globalLogLevel = LogLevel.WARN;

                // WHEN
                logger.info('message');

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockInfo.mock.calls.length).toBe(0);
            });

            test('infoObject(message, object) to console', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                const obj = {message: "I'm a teapot", statusCode: 418};

                // WHEN
                logger.infoObject('Formatted ', obj);

                // THEN
                expect(mockInfo.mock.calls.length).toBe(1);
                expect(mockInfo.mock.calls[0].length).toBe(4);
                expect(mockInfo.mock.calls[0][0]).toMatch(/^....-..-..T..:..:..$/);
                expect(mockInfo.mock.calls[0][1]).toEqual('INFO');
                expect(mockInfo.mock.calls[0][2]).toEqual('LoggerTest:');
                expect(mockInfo.mock.calls[0][3]).toEqual("Formatted {\n  \"message\": \"I'm a teapot\",\n  \"statusCode\": 418\n}");
            });

            test('infoObject(message) to console when log level is WARN', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                Logger.globalLogLevel = LogLevel.WARN;

                // WHEN
                logger.infoObject('message', {});

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockInfo.mock.calls.length).toBe(0);
            });

        });

        describe('warn level', () => {
            test('warn(message) to console', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");

                // WHEN
                logger.warn('message');

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockWarn.mock.calls.length).toBe(1);
                expect(mockWarn.mock.calls[0].length).toBe(4);
                expect(mockWarn.mock.calls[0][0]).toMatch(/^....-..-..T..:..:..$/);
                expect(mockWarn.mock.calls[0][1]).toEqual('WARN');
                expect(mockWarn.mock.calls[0][2]).toEqual('LoggerTest:');
                expect(mockWarn.mock.calls[0][3]).toEqual('message');
            });

            test('warn(message, params) to console', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");

                // WHEN
                logger.warn('message', 1, true, 'third');

                // THEN
                expect(mockWarn.mock.calls.length).toBe(1);
                expect(mockWarn.mock.calls[0].length).toBe(7);
                expect(mockWarn.mock.calls[0][0]).toMatch(/^....-..-..T..:..:..$/);
                expect(mockWarn.mock.calls[0][1]).toEqual('WARN');
                expect(mockWarn.mock.calls[0][2]).toEqual('LoggerTest:');
                expect(mockWarn.mock.calls[0][3]).toEqual('message');
                expect(mockWarn.mock.calls[0][4]).toEqual(1);
                expect(mockWarn.mock.calls[0][5]).toEqual(true);
                expect(mockWarn.mock.calls[0][6]).toEqual('third');

            });

            test('warn(message) to console when log level is ERROR', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                Logger.globalLogLevel = LogLevel.ERROR;

                // WHEN
                logger.warn('message');

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockWarn.mock.calls.length).toBe(0);
            });

            test('warnObject(message, object) to console', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                const obj = {message: "I'm a teapot", statusCode: 418};

                // WHEN
                logger.warnObject('Formatted ', obj);

                // THEN
                expect(mockWarn.mock.calls.length).toBe(1);
                expect(mockWarn.mock.calls[0].length).toBe(4);
                expect(mockWarn.mock.calls[0][0]).toMatch(/^....-..-..T..:..:..$/);
                expect(mockWarn.mock.calls[0][1]).toEqual('WARN');
                expect(mockWarn.mock.calls[0][2]).toEqual('LoggerTest:');
                expect(mockWarn.mock.calls[0][3]).toEqual("Formatted {\n  \"message\": \"I'm a teapot\",\n  \"statusCode\": 418\n}");
            });

            test('warnObject(message) to console when log level is ERROR', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                Logger.globalLogLevel = LogLevel.ERROR;

                // WHEN
                logger.warnObject('message', {});

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockWarn.mock.calls.length).toBe(0);
            });
        });

        describe('error level', () => {
            test('error(message) to console', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");

                // WHEN
                logger.error('message');

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockError.mock.calls.length).toBe(1);
                expect(mockError.mock.calls[0].length).toBe(4);
                expect(mockError.mock.calls[0][0]).toMatch(/^....-..-..T..:..:..$/);
                expect(mockError.mock.calls[0][1]).toEqual('ERROR');
                expect(mockError.mock.calls[0][2]).toEqual('LoggerTest:');
                expect(mockError.mock.calls[0][3]).toEqual('message');
            });

            test('error(message, params) to console', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");

                // WHEN
                logger.error('message', 1, true, 'third');

                // THEN
                expect(mockError.mock.calls.length).toBe(1);
                expect(mockError.mock.calls[0].length).toBe(7);
                expect(mockError.mock.calls[0][0]).toMatch(/^....-..-..T..:..:..$/);
                expect(mockError.mock.calls[0][1]).toEqual('ERROR');
                expect(mockError.mock.calls[0][2]).toEqual('LoggerTest:');
                expect(mockError.mock.calls[0][3]).toEqual('message');
                expect(mockError.mock.calls[0][4]).toEqual(1);
                expect(mockError.mock.calls[0][5]).toEqual(true);
                expect(mockError.mock.calls[0][6]).toEqual('third');
            });

            test('error(exception) to console', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                const error = new Error("I broke");

                // WHEN
                logger.error(error);

                // THEN
                expect(mockError.mock.calls.length).toBe(1);
                expect(mockError.mock.calls[0].length).toBe(4);
                expect(mockError.mock.calls[0][0]).toMatch(/^....-..-..T..:..:..$/);
                expect(mockError.mock.calls[0][1]).toEqual('ERROR');
                expect(mockError.mock.calls[0][2]).toEqual('LoggerTest:');
                expect(mockError.mock.calls[0][3]).toEqual(error);
            });

            test('error(message) to console when log level is NONE', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                Logger.globalLogLevel = LogLevel.NONE;

                // WHEN
                logger.warn('message');

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockWarn.mock.calls.length).toBe(0);
            });

            test('errorObject(message, object) to console', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                const obj = {message: "I'm a teapot", statusCode: 418};

                // WHEN
                logger.errorObject('Formatted ', obj);

                // THEN
                expect(mockError.mock.calls.length).toBe(1);
                expect(mockError.mock.calls[0].length).toBe(4);
                expect(mockError.mock.calls[0][0]).toMatch(/^....-..-..T..:..:..$/);
                expect(mockError.mock.calls[0][1]).toEqual('ERROR');
                expect(mockError.mock.calls[0][2]).toEqual('LoggerTest:');
                expect(mockError.mock.calls[0][3]).toEqual("Formatted {\n  \"message\": \"I'm a teapot\",\n  \"statusCode\": 418\n}");
            });

            test('errorObject(message) to console when log level is NONE', () => {
                // GIVEN
                const logger = new Logger("LoggerTest");
                Logger.globalLogLevel = LogLevel.NONE;

                // WHEN
                logger.warnObject('message', {});

                // THEN
                expect(mockLog.mock.calls.length).toBe(0);
                expect(mockWarn.mock.calls.length).toBe(0);
            });
        });
    });
});
