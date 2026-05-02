
import React from 'react';
import { CDJStage } from './types';
import { EyeIcon } from './components/icons/EyeIcon';
import { ScaleIcon } from './components/icons/ScaleIcon';
import { ShoppingBagIcon } from './components/icons/ShoppingBagIcon';
import { HeartIcon } from './components/icons/HeartIcon';

export const CDJ_STAGES_DETAILS = {
  [CDJStage.Awareness]: {
    name: '인지',
    Icon: EyeIcon,
    color: 'text-blue-300',
    borderColor: 'border-blue-400',
    bgColor: 'bg-blue-500/20',
    printColor: 'text-blue-700',
    printBgColor: 'bg-blue-50',
    printBorderColor: 'border-blue-200',
    description: '사용자가 문제나 필요를 처음으로 인식하는 단계입니다. 주로 정보 탐색이 이루어집니다.',
  },
  [CDJStage.Consideration]: {
    name: '고려',
    Icon: ScaleIcon,
    color: 'text-purple-300',
    borderColor: 'border-purple-400',
    bgColor: 'bg-purple-500/20',
    printColor: 'text-purple-700',
    printBgColor: 'bg-purple-50',
    printBorderColor: 'border-purple-200',
    description: '사용자가 해결책을 모색하며 다양한 옵션을 비교하고 평가하는 단계입니다.',
  },
  [CDJStage.Decision]: {
    name: '결정',
    Icon: ShoppingBagIcon,
    color: 'text-green-300',
    borderColor: 'border-green-400',
    bgColor: 'bg-green-500/20',
    printColor: 'text-green-700',
    printBgColor: 'bg-green-50',
    printBorderColor: 'border-green-200',
    description: '사용자가 최종 구매 결정을 내리는 단계입니다. 구체적인 제품/서비스 정보가 중요해집니다.',
  },
  [CDJStage.Loyalty]: {
    name: '사후 관리',
    Icon: HeartIcon,
    color: 'text-pink-300',
    borderColor: 'border-pink-400',
    bgColor: 'bg-pink-500/20',
    printColor: 'text-pink-700',
    printBgColor: 'bg-pink-50',
    printBorderColor: 'border-pink-200',
    description: '구매 후, 사용자가 제품/서비스를 활용하며 만족도를 느끼고 재구매나 추천을 고려하는 단계입니다.',
  },
};
