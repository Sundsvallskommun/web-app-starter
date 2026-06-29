import resources from '@config/resources';
import { ResourceResponse } from '@interfaces/resource';
import { ResourceName } from '@interfaces/resource-name';
import { Button, Icon, useConfirm } from '@sk-web-gui/react';
import { useCrudHelper } from '@utils/use-crud-helpers';
import { Save, Trash } from 'lucide-react';
import { useRouter } from 'next/router';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { capitalize } from 'underscore.string';

interface ToolbarProps {
  resource: ResourceName;
  id?: number;
  isDirty?: boolean;
}

export const EditorToolbar: React.FC<ToolbarProps> = ({ resource, isDirty, id }) => {
  const router = useRouter();
  const parentPath = resource ? `/${resource}` : (router.pathname.split('/[')[0] ?? '').replace('/new', '');
  const { remove } = resources[resource];
  const { handleRemove } = useCrudHelper(resource);
  const confirm = useConfirm();
  const { reset } = useFormContext();
  const { t } = useTranslation();

  const onRemove = async (): Promise<void> => {
    if (remove && id) {
      const confirmed = await confirm.showConfirmation(
        capitalize(t('common:remove_resource', { resource: t(`${resource}:name_one`) })),
        capitalize(t('common:can_not_be_undone')),
        capitalize(t('common:remove')),
        capitalize(t('common:keep_edit')),
        'error'
      );
      if (!confirmed) return;

      const res = await handleRemove(() => remove(id) as ResourceResponse<unknown>);
      if (res) {
        reset();
        await router.push(parentPath);
      }
    } else if (!id) {
      await router.push(parentPath);
    }
  };

  return (
    <Button.Group className="absolute top-40 right-48 w-fit">
      <Button
        type="submit"
        color="vattjom"
        size="sm"
        showBackground={false}
        leftIcon={<Save />}
        disabled={!isDirty}
        iconButton
        aria-label={capitalize(t('common:save'))}
      ></Button>

      {((!!remove && !!id) || !id) && (
        <>
          <Button
            variant="tertiary"
            color="error"
            showBackground={false}
            iconButton
            aria-label={capitalize(t('common:remove', { resource: t(`${resource}:name_one`) }))}
            size="sm"
            onClick={() => {
              onRemove().catch((error: unknown) => {
                console.error('Failed to remove resource.', error);
              });
            }}
          >
            <Icon icon={<Trash />} />
          </Button>
        </>
      )}
    </Button.Group>
  );
};
