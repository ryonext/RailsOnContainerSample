import * as core from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';

export class CdkStack extends core.Stack {
  constructor(scope: core.Construct, id: string, props?: core.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const targetBucket = new s3.Bucket(this, 'MyFirstBucket', {
      versioned: true
    });

    const sourceOutput = new codepipeline.Artifact();
    const token = process.env.GITHUB_TOKEN || "";

    new codepipeline.Pipeline(this, 'Pipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction(
              {
                actionName: 'GitHub_Source',
                owner: 'ryonext',
                repo: 'RailsOnContainerSample',
                branch: 'master',
                trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
                output: sourceOutput,
                oauthToken: core.SecretValue.plainText(token)
              }
            ),
          ],
        },        
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.S3DeployAction(
              {
                actionName: 'S3Deploy',
                bucket: targetBucket,
                input: sourceOutput
              }
            ),
          ],
        },
      ]
    });

  }
}
