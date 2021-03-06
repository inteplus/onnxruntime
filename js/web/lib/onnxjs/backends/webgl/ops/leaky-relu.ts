// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {LeakyRelu} from '../../../ops/leaky-relu';
import {Tensor} from '../../../tensor';
import {getGlsl} from '../glsl-source';
import {WebGLInferenceHandler} from '../inference-handler';
import {ProgramInfo, RunData, WebGLOperator} from '../types';

export class WebGLLeakyRelu extends LeakyRelu implements WebGLOperator {
  run(inferenceHandler: WebGLInferenceHandler, inputs: Tensor[]): Tensor[] {
    return inferenceHandler.run(this, inputs);
  }
  createProgramInfo(handler: WebGLInferenceHandler, inputs: Tensor[]): ProgramInfo {
    const outputShape = inputs[0].dims.slice();
    const glsl = getGlsl(handler.session.backend.glContext.version);
    const shaderSource = `
      void main() {
        float v = ${glsl.texture2D}(A, TexCoords).r;
        ${glsl.output} = vec4(v < 0.0 ? v * float(${this.alpha}) : v);
      }
      `;
    return {
      hasMain: true,
      inputLayouts: [handler.getOrCreateTextureLayout(inputs[0])],
      outputLayout: handler.createTextureLayoutFromShape(outputShape),
      samplers: ['A'],
      shaderSource,
    };
  }
  createRunData(handler: WebGLInferenceHandler, programInfo: ProgramInfo, inputs: Tensor[]): RunData {
    const inputTDs = [handler.getOrCreateTextureData(inputs[0], programInfo.inputLayouts[0])];
    return {
      inputTextureDatas: inputTDs,
      outputTextureData: handler.createTextureDataFromLayout(programInfo.outputLayout, inputTDs[0].tensor.type),
      uniformData: {}
    };
  }
}
