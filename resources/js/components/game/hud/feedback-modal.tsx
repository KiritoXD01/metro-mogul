import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import FeedbackController from '@/actions/App/Http/Controllers/FeedbackController';
import InputError from '@/components/input-error';
import { useTranslation } from '@/hooks/use-translation';

const MAX_LENGTH = 2000;

type FeedbackModalProps = {
    onClose: () => void;
};

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
    const { t } = useTranslation();
    const [description, setDescription] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-indigo-400" />
                        <h3 className="text-lg font-bold text-white">
                            {t('feedback.title')}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <p className="mb-4 text-sm text-slate-300">
                    {t('feedback.description')}
                </p>
                <Form
                    {...FeedbackController.store.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    onSuccess={() => {
                        onClose();
                    }}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div>
                                <label
                                    htmlFor="feedbackDescription"
                                    className="mb-1 block text-xs font-bold tracking-wider text-slate-400 uppercase"
                                >
                                    {t('feedback.message_label')}
                                </label>
                                <textarea
                                    id="feedbackDescription"
                                    name="description"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    maxLength={MAX_LENGTH}
                                    rows={6}
                                    required
                                    placeholder={t('feedback.placeholder')}
                                    className="w-full resize-y rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    autoFocus
                                />
                                <div className="mt-1 flex items-center justify-between gap-2">
                                    <InputError message={errors.description} />
                                    <span className="ml-auto shrink-0 text-xs text-slate-500">
                                        {t('feedback.character_count', {
                                            current: description.length,
                                            max: MAX_LENGTH,
                                        })}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl px-4 py-2 text-sm text-slate-300 transition-all hover:bg-slate-800"
                                >
                                    {t('feedback.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        description.trim().length === 0
                                    }
                                    className="rounded-xl bg-indigo-500 px-5 py-2 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {t('feedback.submit')}
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </div>
    );
}
