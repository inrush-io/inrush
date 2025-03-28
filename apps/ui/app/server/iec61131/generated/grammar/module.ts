/******************************************************************************
 * This file was generated by langium-cli 3.3.0.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

import type { LangiumSharedCoreServices, LangiumCoreServices, LangiumGeneratedCoreServices, LangiumGeneratedSharedCoreServices, LanguageMetaData, Module } from 'langium';
import { IEC61131AstReflection } from './ast.js';
import { IEC61131Grammar } from './grammar.js';

export const IEC61131LanguageMetaData = {
    languageId: 'iec-61131',
    fileExtensions: ['.st'],
    caseInsensitive: false,
    mode: 'development'
} as const satisfies LanguageMetaData;

export const IEC61131GeneratedSharedModule: Module<LangiumSharedCoreServices, LangiumGeneratedSharedCoreServices> = {
    AstReflection: () => new IEC61131AstReflection()
};

export const IEC61131GeneratedModule: Module<LangiumCoreServices, LangiumGeneratedCoreServices> = {
    Grammar: () => IEC61131Grammar(),
    LanguageMetaData: () => IEC61131LanguageMetaData,
    parser: {}
};
