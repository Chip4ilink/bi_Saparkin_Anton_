--!extension
create or alter view tbm.vw_D_SKU
as
select
	s.ID
	,isnull(s.Name, 'Unknown') collate Cyrillic_General_100_CI_AI				as SKUName
	,isnull(s.CodeManufacturer, 'Unknown') collate Cyrillic_General_100_CI_AI	as SkuCodeManufacturer
	,isnull(b.Name, 'Unknown') collate Cyrillic_General_100_CI_AI				as BrandName
    ,isnull(bu.Name, 'Unknown') collate Cyrillic_General_100_CI_AI              as BusinessUnitName
from dim.SKU as s
	left join dim.Brand as b on b.ID = s.ID_Brand
    left join md_bi.SKUAdditionalInfo as sai on sai.ID = s.ID
    left join bi.BusinessUnit as bu on bu.ID = sai.ID_bi_BusinessUnit
where s.FlagExclude = 0
	and (s.ID_mapping_DataSource = 1
		or s.ID = -1
	)