/**
 * JobPaper 分发器组件
 * 根据主题分发到四个具体的实现组件
 */

import React from 'react';
import { Job } from '@/types/schema';
import { JobTheme, JOB_BUTTON_LABELS } from '@/config/jobUIConfig';
import { JobRejectReason } from '@/store/slices/createJobSlice';
import { JobPaperSlums } from './JobPaperSlums';
import { JobPaperRust } from './JobPaperRust';
import { JobPaperSuburbs } from './JobPaperSuburbs';
import { JobPaperDowntown } from './JobPaperDowntown';

interface JobPaperProps {
  job: Job;
  theme: JobTheme;
  isActive: boolean;
  canApply: boolean;
  lockReasonKey: string;
  lockReasonParams?: Record<string, string | number>;
  onAction: () => void;
  currentInsight: number;
}

export type { JobRejectReason };

export const JobPaper: React.FC<JobPaperProps> = (props) => {
  const { theme } = props;
  const buttonLabels = JOB_BUTTON_LABELS[theme];

  const componentProps = {
    ...props,
    buttonLabels,
  };

  switch (theme) {
    case 'SLUMS':
      return <JobPaperSlums {...componentProps} />;
    case 'RUST_BELT':
      return <JobPaperRust {...componentProps} />;
    case 'SUBURBS':
      return <JobPaperSuburbs {...componentProps} />;
    case 'DOWNTOWN':
      return <JobPaperDowntown {...componentProps} />;
    default:
      return <JobPaperSlums {...componentProps} />;
  }
};
