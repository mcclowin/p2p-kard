from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ("borrow", "0001_initial"),
    ]

    operations = [
        # Add DRAFT to BorrowRequestStatus (handled by model TextChoices, no DB change needed)

        # Make existing fields optional for drafts
        migrations.AlterField(
            model_name="borrowrequest",
            name="title",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name="borrowrequest",
            name="category",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name="borrowrequest",
            name="reason_detailed",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="borrowrequest",
            name="amount_requested_cents",
            field=models.PositiveBigIntegerField(
                blank=True,
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
        migrations.AlterField(
            model_name="borrowrequest",
            name="expected_return_days",
            field=models.PositiveIntegerField(
                blank=True,
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),

        # Add new fields
        migrations.AddField(
            model_name="borrowrequest",
            name="city",
            field=models.CharField(blank=True, max_length=100, default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="borrowrequest",
            name="postcode",
            field=models.CharField(blank=True, max_length=20, default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="borrowrequest",
            name="what_happened",
            field=models.TextField(blank=True, default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="borrowrequest",
            name="how_funds_used",
            field=models.TextField(blank=True, default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="borrowrequest",
            name="current_step",
            field=models.PositiveIntegerField(default=1),
        ),
    ]
