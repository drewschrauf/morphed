module.exports = function () {
    return {
        files: [
            'src/**/*.js'
        ],
        tests: [
            'test/**/*Spec.js'
        ],
        env: {
            type: 'node',
            runner: 'node'
        }
    };
};
