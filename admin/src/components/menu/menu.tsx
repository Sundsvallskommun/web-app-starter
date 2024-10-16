import resources from '@config/resources';
import { MenuVertical } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { capitalize } from 'underscore.string';

export const Menu = () => {
  const [current, setCurrent] = useState<string>('');
  const { t } = useTranslation();

  useEffect(() => {
    const path = window.location.pathname;
    const resource = Object.keys(resources).find((resource) => {
      return path.startsWith(`${process.env.NEXT_PUBLIC_BASE_PATH}/${resource}`);
    });
    if (resource) {
      setCurrent(`${resource}${path.endsWith('/new') ? '-new' : ''}`);
    } else {
      setCurrent('');
    }
  }, [window]);

  useEffect(() => {
    if (current.includes('-parent')) {
      setCurrent(current.replace('-parent', ''));
    }
  }, [current]);

  return (
    <MenuVertical.Provider current={current} setCurrent={setCurrent} rootMenuId="resources">
      <MenuVertical.Nav>
        <MenuVertical.Label>{capitalize(t('common:resources'))}</MenuVertical.Label>
        <MenuVertical>
          {...Object.keys(resources).map((resourcename, index) => {
            const resource = resources[resourcename];
            return (
              <MenuVertical.Item key={`mainmenu-${index}`} menuIndex={`${resource.name}-parent`}>
                <MenuVertical>
                  <MenuVertical.SubmenuButton>
                    <NextLink href={`/${resource.name}`}>{capitalize(t(`${resource.name}:name_many`))}</NextLink>
                  </MenuVertical.SubmenuButton>
                  <MenuVertical.Item menuIndex={resource.name}>
                    <NextLink href={`/${resource.name}`}>
                      {capitalize(t('common:list_all', { resource: t(`${resource.name}:name_many`) }))}
                    </NextLink>
                  </MenuVertical.Item>
                  {resource?.create && (
                    <MenuVertical.Item menuIndex={`${resource.name}-new`}>
                      <NextLink href={`/${resource.name}/new`}>
                        {capitalize(t('common:create_new', { resource: t(`${resource.name}:name_one`) }))}
                      </NextLink>
                    </MenuVertical.Item>
                  )}
                </MenuVertical>
              </MenuVertical.Item>
            );
          })}
        </MenuVertical>
      </MenuVertical.Nav>
    </MenuVertical.Provider>
  );
};
