// Copyright (c) HashiCorp, Inc
// SPDX-License-Identifier: MPL-2.0
import { Construct } from "constructs";
import { App, TerraformStack, CloudBackend, NamedCloudWorkspace } from "cdktf";
import * as google from '@cdktf/provider-google';

const project = 'bookish-telegram';
const region = 'asia-northeast1';
const repository = 'bookish-telegram';

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new google.provider.GoogleProvider(this, 'google', {
      project,
      region,
    });

    const cloud_run_service_account = new google.serviceAccount.ServiceAccount(this, 'cloud_run_service_account', {
      accountId: 'cloud-run-service-account',
      displayName: 'service account for Cloud Run',
    });

    const example_service = new google.cloudRunService.CloudRunService(this, 'cloud_run_service', {
      location: region,
      metadata: {
        annotations: {
          "autoscaling.knative.dev/minScale": "0",
          "autoscaling.knative.dev/maxScale": "1",
        },
      },
      name: 'example',
      template: {
        spec: {
          containers: [{
            image: 'us-docker.pkg.dev/cloudrun/container/hello',
          }],
          serviceAccountName: cloud_run_service_account.email,
        },
      },
    });

    const cloud_run_no_auth = new google.dataGoogleIamPolicy.DataGoogleIamPolicy(this, 'cloud_run_no_auth', {
      binding: [{
        members: ['allUsers'],
        role: 'roles/run.invoker',
      }],
    });

    new google.cloudRunServiceIamPolicy.CloudRunServiceIamPolicy(this, 'example_service_no_auth', {
      location: region,
      service: example_service.name,
      policyData: cloud_run_no_auth.policyData,
    });

    new google.cloudbuildTrigger.CloudbuildTrigger(this, 'cloud_build_trigger', {
      filename: 'cloudbuild.yaml',
      github: {
        owner: 'hsmtkk',
        name: repository,
        push: {
          branch: 'main',
        },
      },
    });

    new google.artifactRegistryRepository.ArtifactRegistryRepository(this, 'artifact_registry', {
      format: 'docker',
      location: region,
      repositoryId: 'registry',
    });

  }
}

const app = new App();
const stack = new MyStack(app, "bookish-telegram");
new CloudBackend(stack, {
  hostname: "app.terraform.io",
  organization: "hsmtkkdefault",
  workspaces: new NamedCloudWorkspace("bookish-telegram")
});
app.synth();
