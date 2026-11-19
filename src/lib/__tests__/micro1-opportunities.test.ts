import assert from 'node:assert/strict';
import test from 'node:test';
import {
  describeMicro1Opportunity,
  formatMicro1Pay,
  getMicro1Categories,
  getMicro1FilterOptions,
  matchesMicro1QuickFilter,
  translateMicro1Title,
  type Micro1Opportunity,
} from '../micro1-opportunities';

const sampleOpportunity: Micro1Opportunity = {
  jobId: 'job-1',
  jobName: 'Senior Software Engineer (Brazil)',
  companyName: 'micro1',
  datePosted: null,
  openings: 3,
  highDemand: true,
  roleType: 'expert',
  jobType: 'REGULAR',
  domainSlug: 'software-engineering',
  skills: ['TypeScript', 'AI'],
  referralRewardUsd: 100,
  applyUrl: 'https://jobs.micro1.ai/post/job-1',
  hourlyRate: { min: 20, max: 40 },
  monthlySalary: null,
  yearlyCompensation: null,
};

test('translates common role terms without hiding the original title', () => {
    assert.equal(translateMicro1Title(sampleOpportunity.jobName), 'Engenheiro de software sênior (Brasil)');
});

test('groups all opportunities by domain', () => {
    const categories = getMicro1Categories([
      sampleOpportunity,
      { ...sampleOpportunity, jobId: 'job-2', domainSlug: 'language-audio' },
      { ...sampleOpportunity, jobId: 'job-3', domainSlug: 'language-audio' },
    ]);

    assert.deepEqual(categories[0], { slug: 'language-audio', count: 2, label: 'Idiomas e áudio' });
    assert.deepEqual(categories[1], { slug: 'software-engineering', count: 1, label: 'Tecnologia e programação' });
});

test('shows original USD pay and clearly approximate BRL conversion', () => {
    assert.deepEqual(formatMicro1Pay(sampleOpportunity), {
      original: 'US$ 20–40/hora',
      estimatedBrl: '≈ R$ 104–208/hora',
    });
});

test('uses a domain-specific Portuguese explanation', () => {
    assert.match(describeMicro1Opportunity(sampleOpportunity), /experiência em tecnologia/u);
});

test('places quick filters before the Micro1 specialties', () => {
    const options = getMicro1FilterOptions([
      sampleOpportunity,
      { ...sampleOpportunity, jobId: 'job-2', jobName: 'Video Recorder', roleType: 'generalist' },
      { ...sampleOpportunity, jobId: 'job-3', jobName: 'Data Reviewer', roleType: null },
    ]);

    assert.deepEqual(options.slice(0, 4).map((option) => option.slug), ['portugues', 'facil', 'medio', 'avancado']);
    assert.equal(options.find((option) => option.slug === 'portugues')?.count, 1);
    assert.equal(options.find((option) => option.slug === 'facil')?.count, 1);
    assert.equal(options.find((option) => option.slug === 'medio')?.count, 1);
});

test('matches Portuguese and editorial difficulty filters', () => {
    assert.equal(matchesMicro1QuickFilter(sampleOpportunity, 'portugues'), true);
    assert.equal(matchesMicro1QuickFilter(sampleOpportunity, 'avancado'), true);
    assert.equal(matchesMicro1QuickFilter({ ...sampleOpportunity, roleType: 'generalist' }, 'facil'), true);
    assert.equal(matchesMicro1QuickFilter({ ...sampleOpportunity, roleType: null }, 'medio'), true);
});
