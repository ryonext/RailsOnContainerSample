import * as core from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";


export class CdkStack extends core.Stack {
  constructor(scope: core.Construct, id: string, props?: core.StackProps) {
    super(scope, id, props);


    const vpc = new ec2.Vpc(this, "MyVpc", {
      maxAzs: 3 // Default is all AZs in region
    });

    const cluster = new ecs.Cluster(this, "MyCluster", {
      vpc: vpc
    });

    // The code that defines your stack goes here
    const targetBucket = new s3.Bucket(this, 'MyFirstBucket', {
      versioned: true
    });

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();
    const token = process.env.GITHUB_TOKEN || "";

    const codeBuildProject = new codebuild.PipelineProject(this, 'Project', {
      // properties as above...
      projectName: 'MyBuild'
    });
    
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
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction(
              {
                actionName: 'CodeBuild',
                project: codeBuildProject,
                input: sourceOutput,
                outputs: [buildOutput]
              }
            )  
          ]
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
